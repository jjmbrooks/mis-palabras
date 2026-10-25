// Lógica pura del Modo con tutor (docs/mecanica-inicial.md). Sin DOM ni Firebase: probada en tests/unit.
import { DECK, SIMILAR, WORDS, wordById, isLong, SYLLABLES } from './deck';

/**
 * Tipos de carta (D12, docs/mecanica-inicial.md §2).
 * - elegir_texto (D15): se ve el dibujo, la voz dice «Toca donde dice MIEL» y el niño elige entre 2–3 palabras escritas.
 * - leer: el niño lee en voz alta la palabra escrita, sola; el tutor marca el resultado.
 * imagen_estimulo (D12–D14) e imagen_texto / emparejar / solo_texto quedan solo para leer historiales antiguos.
 */
export type CardType = 'imagen_estimulo' | 'elegir_texto' | 'leer' | 'imagen_texto' | 'emparejar' | 'solo_texto';
export type Help = 'ninguna' | 'A' | 'B' | 'C';

/** Registro por ensayo (§8). Sin nombre, fotos ni audio del niño. */
export interface TrialRecord {
  childId: string; // id aleatorio, nunca el apodo
  sessionId: string; // id aleatorio de la sesión, para el criterio de «2 sesiones seguidas»
  word: string; // id de la palabra, p. ej. "miel"
  cardType: CardType;
  help: Help; // ayuda máxima usada en el ensayo
  correct: boolean; // acierto al primer intento y sin ayuda
  latencyMs: number;
  at: number; // fecha y hora (ms epoch)
  mode?: Mode; // D13; ausente en ensayos anteriores = tutor
  helps?: number; // D13: cuántas ayudas se activaron en el ensayo
  miss?: boolean; // D16: la primera respuesta fue incorrecta (pedir Ayuda o esperar no es fallo)
  level?: Level; // D16: nivel N1–N5 con el que se presentó; ausente en ensayos anteriores a D16
}

export type Mode = 'tutor' | 'independiente';
export const DECK_ID = 'abejas-jardin'; // mazo por omisión; el de cada sesión es activeDeck().id (deck.ts)

/** Registro de sesión (D13). Sin datos del niño más allá de su id aleatorio. */
export interface SessionRecord {
  id: string;
  childId: string;
  mode: Mode;
  deck: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  trials: number;
}

/**
 * Niveles por palabra (D16, docs/mecanica-inicial.md §5). Los apoyos se retiran de uno en uno:
 * N1 dibujo + «Toca donde dice X», 2 opciones muy distintas (longitud o letra inicial)
 * N2 igual, con 3 opciones
 * N3 dibujo + distractores parecidos (misma letra inicial o misma longitud)
 * N4 sin dibujo, «Toca donde dice X», distractores parecidos  → la palabra queda DOMINADA
 * N5 la palabra sola, «¿Qué dice aquí?»; el niño la dice y el tutor marca (solo con tutor)
 */
export type Level = 1 | 2 | 3 | 4 | 5;
export const MAX_LEVEL: Level = 5;
export const MASTERED_LEVEL: Level = 4;
/** @deprecated D15; se conserva para pruebas antiguas: tipos de carta en uso. */
export const LEVELS: CardType[] = ['elegir_texto', 'leer'];
export const cardTypeFor = (l: Level): CardType => (l === 5 ? 'leer' : 'elegir_texto');
export const pictureFor = (l: Level) => l <= 3;
export const optionCountFor = (l: Level) => (l === 1 ? 2 : l === 5 ? 1 : 3);

/** Historiales anteriores a D16: tipos antiguos equivalentes. */
const LEGACY: Partial<Record<CardType, CardType>> = { imagen_estimulo: 'elegir_texto', imagen_texto: 'elegir_texto', emparejar: 'elegir_texto', solo_texto: 'leer' };
export const normalizeCardType = (c: CardType): CardType => LEGACY[c] ?? c;
export const MASTER = 0.9; // ≥ 90 % al primer intento en 2 sesiones seguidas → sube
export const DROP_FAILS = 2; // 2 fallos seguidos → baja un nivel

export interface WordState {
  level: Level;
  mastered: boolean; // alcanzó N4
  complete: boolean; // superó también N5 (lectura en voz alta con tutor)
}

/** Estado anterior a D16 (D12–D15): elegir → leer → dominada, con ≥90 % / <60 % en 2 sesiones. */
function legacyLevel(trials: TrialRecord[]): Level {
  const sessions: string[] = [];
  for (const t of trials) if (!sessions.includes(t.sessionId)) sessions.push(t.sessionId);
  let level = 0, done = false, hi = 0, lo = 0;
  for (const s of sessions) {
    const ts = trials.filter(t => t.sessionId === s && LEVELS.indexOf(normalizeCardType(t.cardType)) === level);
    if (!ts.length) continue;
    const acc = ts.filter(t => t.correct).length / ts.length;
    if (acc >= MASTER) { hi++; lo = 0; } else if (acc < 0.6) { lo++; hi = 0; } else { hi = 0; lo = 0; }
    if (hi >= 2) { hi = 0; if (level === 1) done = true; else level++; }
    else if (lo >= 2) { lo = 0; done = false; if (level > 0) level--; }
  }
  // Migración conservadora (D16, revisión de Diversa): «elegir» → N1; ya en «leer» → N3 (no dominada);
  // «leer» superado → N4 SIN dominio: se verifica con el criterio nuevo (2 sesiones ≥90 % en N4), no se hereda.
  return done ? 4 : level === 1 ? 3 : 1;
}

/** Fallo al primer intento: la primera respuesta fue incorrecta. Ensayos sin `miss` (anteriores) = no acertado y sin ayuda pedida antes. */
export const isFirstTryMiss = (t: Pick<TrialRecord, 'correct' | 'miss' | 'help'>) => t.miss ?? (!t.correct && t.help !== 'ninguna');

/** Nivel de cada palabra a partir del historial (D16). La práctica independiente no cuenta (D5/D13). */
/** Las palabras largas (4+ sílabas, configurable en LENGTH_OVERRIDE) esperan a que todas las cortas del mazo estén dominadas (N4).
 *  Una palabra larga que ya tiene historial no se vuelve a bloquear. */
export function lockedWord(id: string, states: Map<string, WordState>): boolean {
  if (!isLong(id) || (states.get(id)?.level ?? 1) > 1) return false;
  return DECK.some(w => !isLong(w.id) && !states.get(w.id)?.mastered);
}

/** Palabras con historial en el perfil (de cualquier mazo). */
export const seenWords = (history: TrialRecord[]) => [...new Set(history.map(t => t.word))].filter(id => WORDS.some(w => w.id === id));

export function wordStates(history: TrialRecord[]): Map<string, WordState> {
  const out = new Map<string, WordState>();
  const sorted = history.filter(t => t.mode !== 'independiente').sort((a, b) => a.at - b.at);
  for (const w of DECK) {
    const trials = sorted.filter(t => t.word === w.id);
    const legacy = trials.filter(t => t.level === undefined);
    let level: Level = legacy.length ? legacyLevel(legacy) : 1;
    let complete = false; // nunca se hereda
    let verified = !legacy.length || level < MASTERED_LEVEL; // N4 migrado: falta verificar el dominio
    let hi = 0, fails = 0;
    const sessions: string[] = [];
    const fresh = trials.filter(t => t.level !== undefined);
    for (const t of fresh) if (!sessions.includes(t.sessionId)) sessions.push(t.sessionId);
    for (const s of sessions) {
      let n = 0, ok = 0, dropped = false;
      for (const t of fresh.filter(x => x.sessionId === s)) {
        if (t.level !== level) continue;
        n++;
        if (t.correct) { ok++; fails = 0; continue; }
        // Para bajar solo cuentan los fallos al primer intento (no pedir Ayuda ni esperar).
        if (!isFirstTryMiss(t)) continue;
        if (++fails >= DROP_FAILS) {
          fails = 0; hi = 0; complete = false; dropped = true;
          if (level > 1) level = (level - 1) as Level;
          if (level < MASTERED_LEVEL) verified = true;
          n = 0; ok = 0;
        }
      }
      if (dropped || !n) { if (dropped) hi = 0; continue; }
      if (ok / n >= MASTER) {
        if (++hi >= 2) { hi = 0; verified = true; if (level === MAX_LEVEL) complete = true; else level = (level + 1) as Level; }
      } else hi = 0;
    }
    out.set(w.id, { level, mastered: level >= MASTERED_LEVEL && verified, complete });
  }
  return out;
}

export type Rng = () => number;
export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const similar = (a: string, b: string) => SIMILAR.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const upper = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const textOf = (id: string) => upper(wordById(id).text);
const len = (id: string) => [...textOf(id)].length;
/** N1/N2: distractor muy distinto (otra letra inicial y ≥2 letras de diferencia en longitud). */
export const isVeryDifferent = (a: string, b: string) => textOf(a)[0] !== textOf(b)[0] && Math.abs(len(a) - len(b)) >= 2;
/** N3/N4: distractor parecido (misma letra inicial o misma longitud). */
export const isLookAlike = (a: string, b: string) => a !== b && (textOf(a)[0] === textOf(b)[0] || len(a) === len(b));

/** Distractores según el nivel (D16). Con pocas palabras se completa con la mejor alternativa. */
export function distractors(word: string, level: Level, rng: Rng, pool: string[] = DECK.map(w => w.id), seen: string[] = []): string[] {
  const n = optionCountFor(level) - 1;
  if (n <= 0) return [];
  const others = shuffle(pool.filter(id => id !== word), rng);
  let ranked: string[];
  if (level <= 2) {
    const ok = others.filter(id => !similar(id, word));
    // Si el mazo no alcanza con distractores muy distintos, se toman de palabras ya vistas de otros mazos.
    const inDeck = ok.filter(id => isVeryDifferent(id, word));
    const borrowed = inDeck.length >= n ? [] : shuffle(seen.filter(id => id !== word && !pool.includes(id) && WORDS.some(w => w.id === id) && isVeryDifferent(id, word)), rng);
    ranked = [...inDeck, ...borrowed,
      ...ok.filter(id => !isVeryDifferent(id, word) && !isLookAlike(id, word)),
      ...ok.filter(id => isLookAlike(id, word))];
  } else {
    ranked = [...others.filter(id => similar(id, word)), ...others.filter(id => !similar(id, word) && isLookAlike(id, word)),
      ...others.filter(id => !isLookAlike(id, word)).sort((a, b) => Math.abs(len(a) - len(word)) - Math.abs(len(b) - len(word)))];
  }
  return [...new Set(ranked)].slice(0, n);
}

export interface TrialSpec {
  word: string;
  level: Level;
  cardType: CardType;
  picture: boolean; // dibujo visible durante el ensayo (N1–N3)
  options: string[]; // palabras escritas, ya mezcladas ([word] en N5)
  presentFirst: boolean; // carta de enseñanza imagen + texto antes (§3.1); desde D15 no se usa
  repeat: boolean; // repetición tras un error o ayuda
}

export interface SessionOptions {
  /** El niño ya conoce los dibujos: se salta la carta de enseñanza imagen + texto (D12.5; desde D15 siempre true). */
  knowsPictures: boolean;
  /** Palabras de OTROS mazos que el niño ya vio (tienen historial en su perfil): reserva para N1/N2 cuando el mazo
   *  activo no tiene un distractor muy distinto (mazos nuevos). Nunca se usan palabras que el niño no haya visto. */
  seen?: string[];
}

/** Acierto independiente: al primer intento y sin ayuda. Un ensayo con ayuda nunca cuenta (D12.2). */
export const isIndependent = (firstTry: boolean, help: Help) => firstTry && help === 'ninguna';

export interface SessionConfig { trials: number; maxTrials: number; targets: number }
export const DEFAULT_CONFIG: SessionConfig = { trials: 12, maxTrials: 15, targets: 3 };

export function buildSpec(word: string, level: Level, rng: Rng, repeat = false, presentFirst = false, seen: string[] = []): TrialSpec {
  const options = level === 5 ? [word] : shuffle([word, ...distractors(word, level, rng, undefined, seen)], rng);
  return { word, level, cardType: cardTypeFor(level), picture: pictureFor(level), options, presentFirst, repeat };
}

/** Sesión con tutor de 12–15 ensayos con 2–4 palabras objetivo mezcladas con conocidas (§4). */
export class Session {
  readonly targets: string[];
  readonly known: string[];
  private queue: string[] = [];
  private done: { word: string; correct: boolean }[] = [];
  private presented = new Set<string>();
  private lastWord = '';
  private level = new Map<string, Level>();
  private fails = new Map<string, number>();

  constructor(private states: Map<string, WordState>, private rng: Rng = Math.random,
              readonly cfg: SessionConfig = DEFAULT_CONFIG, preferred: string[] = [],
              readonly opts: SessionOptions = { knowsPictures: true }) {
    const ids = DECK.map(w => w.id);
    const open = ids.filter(id => !states.get(id)?.complete && !lockedWord(id, states));
    // Palabras nuevas de menos a más sílabas (orden estable dentro de cada grupo).
    open.sort((x, y) => (SYLLABLES[x] ?? 1) - (SYLLABLES[y] ?? 1));
    const ordered = [...preferred.filter(id => open.includes(id)), ...open.filter(id => !preferred.includes(id))];
    const t: string[] = [];
    for (const id of ordered) { if (t.length >= Math.min(4, Math.max(2, cfg.targets))) break; if (!t.some(x => similar(x, id))) t.push(id); }
    const free = ids.filter(id => !lockedWord(id, states));
    this.targets = t.length ? t : shuffle(free.length ? free : ids, rng).slice(0, 2);
    const known = ids.filter(id => states.get(id)?.mastered && !this.targets.includes(id));
    this.known = known.length ? known : [...this.targets];
    for (const id of ids) this.level.set(id, states.get(id)?.level ?? 1);
  }

  get count() { return this.done.length; }
  get finished() {
    const last = this.done[this.done.length - 1];
    return this.done.length >= this.cfg.maxTrials || (this.done.length >= this.cfg.trials && !!last?.correct);
  }
  levelOf(word: string): Level { return this.level.get(word) ?? 1; }

  private build(word: string, repeat = false): TrialSpec {
    const presentFirst = !this.opts.knowsPictures && !repeat && !this.presented.has(word) && !this.states.get(word)?.mastered;
    this.presented.add(word);
    return buildSpec(word, this.levelOf(word), this.rng, repeat, presentFirst, this.opts.seen ?? []);
  }

  next(): TrialSpec | null {
    if (this.finished) return null;
    // Nunca la misma palabra dos veces seguidas (D16): la repetición tras error espera un ensayo.
    const qi = this.queue.findIndex(w => w !== this.lastWord);
    if (qi >= 0) { const [w] = this.queue.splice(qi, 1); this.lastWord = w; return this.build(w, true); }
    const mustEndWell = this.done.length >= this.cfg.trials - 1;
    const pickFrom = mustEndWell ? this.known : (this.rng() < 0.7 ? this.targets : this.known);
    let c = pickFrom.filter(w => w !== this.lastWord);
    if (!c.length) c = [...this.targets, ...this.known].filter(w => w !== this.lastWord);
    if (!c.length) c = DECK.map(w => w.id).filter(w => w !== this.lastWord);
    this.lastWord = c[Math.floor(this.rng() * c.length)];
    return this.build(this.lastWord);
  }

  /** Tras un error se repite la palabra después de otra (§3.4); 2 fallos seguidos bajan un nivel ya en la sesión (D16). */
  record(spec: TrialSpec, correct: boolean, miss = !correct) {
    this.done.push({ word: spec.word, correct });
    if (correct) { this.fails.set(spec.word, 0); return; }
    if (!spec.repeat) this.queue.push(spec.word);
    if (!miss) return; // con Ayuda pero sin fallo: se repite, no baja
    const f = (this.fails.get(spec.word) ?? 0) + 1;
    if (f >= DROP_FAILS) { this.fails.set(spec.word, 0); const l = this.levelOf(spec.word); if (l > 1) this.level.set(spec.word, (l - 1) as Level); }
    else this.fails.set(spec.word, f);
  }
}

/**
 * Siguiente nivel de ayuda (D12): ninguna → B (carta imagen + texto como ayuda) → C (guía del tutor).
 * Se activa con el botón «Ayuda», tras ≈5 s sin respuesta o tras un error; sin sonido negativo.
 * «A» queda solo para historiales anteriores a D12.
 */
export const nextHelp = (h: Help): Help => (h === 'ninguna' ? 'B' : 'C');

export function toCSV(rows: TrialRecord[]): string {
  const head = ['childId', 'sessionId', 'word', 'cardType', 'help', 'correct', 'latencyMs', 'at', 'mode', 'helps', 'level', 'miss'];
  const esc = (v: unknown) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [head.join(','), ...rows.map(r => [r.childId, r.sessionId, r.word, r.cardType, r.help, r.correct, r.latencyMs, new Date(r.at).toISOString(), r.mode ?? 'tutor', r.helps ?? '', r.level ?? '', r.miss ?? ''].map(esc).join(','))].join('\n');
}

// ---------- D13: progreso por sesión ----------

export interface WordProgress { word: string; trials: number; firstTry: number; pct: number; helps: number }
export interface SessionProgress { session: SessionRecord; words: WordProgress[]; pct: number }

/** % de aciertos al primer intento (sin ayuda) por palabra en cada sesión, más reciente primero. */
export function progress(sessions: SessionRecord[], trials: TrialRecord[]): SessionProgress[] {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt).map(session => {
    const ts = trials.filter(t => t.sessionId === session.id);
    const ids = [...new Set(ts.map(t => t.word))];
    const words = ids.map(word => {
      const w = ts.filter(t => t.word === word); const ok = w.filter(t => t.correct).length;
      return { word, trials: w.length, firstTry: ok, pct: Math.round((ok / w.length) * 100), helps: w.reduce((s, t) => s + (t.helps ?? (t.help === 'ninguna' ? 0 : 1)), 0) };
    });
    const ok = ts.filter(t => t.correct).length;
    return { session, words, pct: ts.length ? Math.round((ok / ts.length) * 100) : 0 };
  });
}

// ---------- D13: modo independiente ----------

export const INDEP_MIN = 3, INDEP_MAX = 5;
export const clampIndepMinutes = (m: number) => Math.min(INDEP_MAX, Math.max(INDEP_MIN, Math.round(m) || 4));
/** D16: el modo solo se abre con ≥3 palabras dominadas y termina a los 10 aciertos o a los 4 min. */
export const INDEP_MIN_WORDS = 3, INDEP_GOAL = 10, INDEP_MINUTES = 4;

/**
 * Práctica sin tutor (D13, D16): solo palabras dominadas (N4), en N4 (sin dibujo, «Toca donde dice…»,
 * distractores parecidos). Nunca la misma palabra dos veces seguidas; posiciones al azar.
 * Termina a los 10 aciertos o a los 4 min, lo que pase primero. N5 es solo con tutor.
 */
export class IndependentSession {
  readonly words: string[];
  readonly limitMs: number;
  private last = '';
  private queue: string[] = [];
  count = 0;
  correct = 0;
  constructor(states: Map<string, WordState>, private rng: Rng = Math.random, readonly maxTrials = 30) {
    this.words = DECK.map(w => w.id).filter(id => states.get(id)?.mastered);
    this.limitMs = INDEP_MINUTES * 60_000;
  }
  get available() { return this.words.length >= INDEP_MIN_WORDS; }
  done(elapsedMs: number) { return !this.available || elapsedMs >= this.limitMs || this.correct >= INDEP_GOAL || this.count >= this.maxTrials; }
  /** null al terminar (10 aciertos, 4 min o tope de ensayos) o si no hay 3 palabras dominadas. */
  next(elapsedMs: number): TrialSpec | null {
    if (this.done(elapsedMs)) return null;
    const qi = this.queue.findIndex(w => w !== this.last);
    let word: string, repeat = false;
    if (qi >= 0) { word = this.queue.splice(qi, 1)[0]; repeat = true; }
    else { const c = this.words.filter(w => w !== this.last); word = c[Math.floor(this.rng() * c.length)]; }
    this.last = word;
    return buildSpec(word, MASTERED_LEVEL, this.rng, repeat);
  }
  record(spec: TrialSpec, correct: boolean) {
    this.count++;
    if (correct) this.correct++;
    else if (!spec.repeat) this.queue.push(spec.word);
  }
}

// ---------- D14: instrucción hablada ----------

/** Tipos en los que la instrucción NUNCA dice la palabra meta (bloqueo de estímulo, como D12). */
export const NO_TARGET_IN_INSTRUCTION: CardType[] = ['leer', 'solo_texto'];

/**
 * Instrucción de cada ensayo (D14): `spoken` se lee en voz alta al empezar y con el botón 🔊;
 * `shown` es el único texto visible.
 * - leer: frase neutra, sin la palabra meta.
 * - cualquier otro tipo (elegir_texto y los antiguos con dibujo, D15): «Toca donde dice ABEJA». Aquí sí se nombra, porque la tarea es emparejar lo que oye con el texto.
 */
export function instructionFor(c: CardType, wordText: string): { spoken: string; shown: string } {
  if (c === 'leer' || c === 'solo_texto') return { spoken: '¿Qué dice aquí?', shown: '¿Qué dice aquí?' };
  return { spoken: `Toca donde dice ${wordText}`, shown: 'Toca donde dice…' };
}

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** true si la frase contiene la palabra como palabra completa (sin importar acentos ni mayúsculas). */
export const mentionsWord = (phrase: string, word: string) =>
  new RegExp(`(^|[^a-zñ])${fold(word)}([^a-zñ]|$)`).test(fold(phrase));
