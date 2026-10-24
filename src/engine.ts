// Lógica pura del Modo con tutor (docs/mecanica-inicial.md). Sin DOM ni Firebase: probada en tests/unit.
import { DECK, SIMILAR } from './deck';

/**
 * Tipos de carta (D12, docs/mecanica-inicial.md §2).
 * - imagen_estimulo: el niño ve solo el dibujo y elige entre palabras escritas.
 * - elegir_texto: el tutor dice la palabra y el niño la elige entre 2–3 palabras escritas.
 * - leer: el niño lee en voz alta la palabra escrita, sola; el tutor marca el resultado.
 * imagen_texto / emparejar / solo_texto quedan solo para leer historiales anteriores a D12.
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
}

export type Mode = 'tutor' | 'independiente';
export const DECK_ID = 'abejas-jardin';

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

export const LEVELS: CardType[] = ['imagen_estimulo', 'elegir_texto', 'leer'];
/** Equivalencia de historiales anteriores a D12 con los niveles actuales. */
const LEGACY: Partial<Record<CardType, CardType>> = { imagen_texto: 'imagen_estimulo', emparejar: 'elegir_texto', solo_texto: 'leer' };
const levelOf = (c: CardType) => LEVELS.indexOf(LEGACY[c] ?? c);
export const MASTER = 0.9; // ≥ 90 % (§5)
export const DROP = 0.6; // < ≈60 % (§5)

export interface WordState { level: number; mastered: boolean }

/** Nivel de apoyo de cada palabra a partir del historial (§5). */
export function wordStates(history: TrialRecord[]): Map<string, WordState> {
  const out = new Map<string, WordState>();
  // D5/D13: la práctica independiente no cuenta para el dominio.
  const sorted = history.filter(t => t.mode !== 'independiente').sort((a, b) => a.at - b.at);
  for (const w of DECK) {
    const trials = sorted.filter(t => t.word === w.id);
    const sessions: string[] = [];
    for (const t of trials) if (!sessions.includes(t.sessionId)) sessions.push(t.sessionId);
    let level = 0, mastered = false, hi = 0, lo = 0;
    for (const s of sessions) {
      const ts = trials.filter(t => t.sessionId === s && levelOf(t.cardType) === level);
      if (!ts.length) continue;
      const acc = ts.filter(t => t.correct).length / ts.length;
      if (acc >= MASTER) { hi++; lo = 0; } else if (acc < DROP) { lo++; hi = 0; } else { hi = 0; lo = 0; }
      if (hi >= 2) {
        hi = 0;
        if (level === LEVELS.length - 1) mastered = true; else level++;
      } else if (lo >= 2) {
        lo = 0; mastered = false; if (level > 0) level--;
      }
    }
    out.set(w.id, { level, mastered });
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

export interface TrialSpec {
  word: string;
  cardType: CardType;
  options: string[]; // palabras escritas, ya mezcladas ([word] en «leer»)
  presentFirst: boolean; // fase de enseñanza imagen + texto antes (§3.1); nunca si el niño ya conoce los dibujos
  repeat: boolean; // repetición sola tras ayuda: la única que cuenta como acierto independiente
}

export interface SessionOptions {
  /** El niño ya conoce los dibujos: se salta la fase de enseñanza imagen + texto (D12.5). */
  knowsPictures: boolean;
}

/** Acierto independiente: al primer intento y sin ayuda. Un ensayo con ayuda nunca cuenta (D12.2). */
export const isIndependent = (firstTry: boolean, help: Help) => firstTry && help === 'ninguna';

export interface SessionConfig { trials: number; maxTrials: number; targets: number }
export const DEFAULT_CONFIG: SessionConfig = { trials: 12, maxTrials: 15, targets: 3 };

/** Sesión de 10–15 ensayos con 2–4 palabras objetivo mezcladas con conocidas (§4). */
export class Session {
  readonly targets: string[];
  readonly known: string[];
  private queue: TrialSpec[] = [];
  private done: { word: string; correct: boolean }[] = [];
  private presented = new Set<string>();
  private lastSpec: TrialSpec | null = null;

  constructor(private states: Map<string, WordState>, private rng: Rng = Math.random,
              readonly cfg: SessionConfig = DEFAULT_CONFIG, preferred: string[] = [],
              readonly opts: SessionOptions = { knowsPictures: false }) {
    const notMastered = DECK.map(w => w.id).filter(id => !states.get(id)?.mastered);
    const ordered = [...preferred.filter(id => notMastered.includes(id)), ...notMastered.filter(id => !preferred.includes(id))];
    const t: string[] = [];
    for (const id of ordered) { if (t.length >= Math.min(4, Math.max(2, cfg.targets))) break; if (!t.some(x => similar(x, id))) t.push(id); }
    this.targets = t.length ? t : shuffle(DECK.map(w => w.id), rng).slice(0, 2);
    const mastered = DECK.map(w => w.id).filter(id => states.get(id)?.mastered);
    this.known = mastered.length ? mastered : [...this.targets];
  }

  get count() { return this.done.length; }
  get finished() {
    const last = this.done[this.done.length - 1];
    return this.done.length >= this.cfg.maxTrials || (this.done.length >= this.cfg.trials && !!last?.correct);
  }

  /** 2 opciones al inicio; 3 cuando la palabra supera el 80 % de aciertos en la sesión (§3.2). */
  optionCount(word: string): number {
    const ts = this.done.filter(d => d.word === word);
    return ts.length >= 2 && ts.filter(d => d.correct).length / ts.length > 0.8 ? 3 : 2;
  }

  private build(word: string, repeat = false): TrialSpec {
    const level = this.states.get(word)?.level ?? 0;
    const cardType = LEVELS[level];
    const n = this.optionCount(word);
    const pool = shuffle(DECK.map(w => w.id).filter(id => id !== word && !similar(id, word)), this.rng);
    const options = cardType === 'leer' ? [word] : shuffle([word, ...pool.slice(0, n - 1)], this.rng);
    const presentFirst = !this.opts.knowsPictures && !repeat && !this.presented.has(word) && !this.states.get(word)?.mastered;
    this.presented.add(word);
    return { word, cardType, options, presentFirst, repeat };
  }

  next(): TrialSpec | null {
    if (this.finished) return null;
    let spec = this.queue.shift();
    if (!spec) {
      const mustEndWell = this.done.length >= this.cfg.trials - 1;
      const pickFrom = mustEndWell ? this.known : (this.rng() < 0.7 ? this.targets : this.known);
      let candidates = pickFrom.filter(w => w !== this.lastSpec?.word);
      if (!candidates.length) candidates = pickFrom;
      spec = this.build(candidates[Math.floor(this.rng() * candidates.length)]);
    }
    this.lastSpec = spec;
    return spec;
  }

  /** Tras responder: si hubo ayuda o error, se repite la palabra sola (sin ayuda) y luego una conocida (§3.4). */
  record(spec: TrialSpec, correct: boolean) {
    this.done.push({ word: spec.word, correct });
    if (!correct && !spec.repeat) {
      this.queue.push(this.build(spec.word, true));
      const k = this.known.filter(w => w !== spec.word);
      this.queue.push(this.build((k.length ? k : this.known)[Math.floor(this.rng() * (k.length || this.known.length))]));
    }
  }
}

/**
 * Siguiente nivel de ayuda (D12): ninguna → B (carta imagen + texto como ayuda) → C (guía del tutor).
 * Se activa con el botón «Ayuda», tras ≈5 s sin respuesta o tras un error; sin sonido negativo.
 * «A» queda solo para historiales anteriores a D12.
 */
export const nextHelp = (h: Help): Help => (h === 'ninguna' ? 'B' : 'C');

export function toCSV(rows: TrialRecord[]): string {
  const head = ['childId', 'sessionId', 'word', 'cardType', 'help', 'correct', 'latencyMs', 'at', 'mode', 'helps'];
  const esc = (v: unknown) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [head.join(','), ...rows.map(r => [r.childId, r.sessionId, r.word, r.cardType, r.help, r.correct, r.latencyMs, new Date(r.at).toISOString(), r.mode ?? 'tutor', r.helps ?? ''].map(esc).join(','))].join('\n');
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

/** Práctica sin tutor: solo palabras dominadas; sesión corta (3–5 min) que cierra sola. */
export class IndependentSession {
  readonly words: string[];
  readonly limitMs: number;
  private last = '';
  private queue: TrialSpec[] = [];
  count = 0;
  constructor(states: Map<string, WordState>, private rng: Rng = Math.random, minutes = 4, readonly maxTrials = 30) {
    this.words = DECK.map(w => w.id).filter(id => states.get(id)?.mastered);
    this.limitMs = clampIndepMinutes(minutes) * 60_000;
  }
  get available() { return this.words.length > 0; }
  private build(word: string, repeat = false): TrialSpec {
    const n = this.words.length >= 6 ? 3 : 2;
    // Distractores: otras palabras dominadas primero; si no alcanzan, del mazo (nunca parecidas).
    const ok = (id: string) => id !== word && !similar(id, word);
    const pool = [...shuffle(this.words.filter(ok), this.rng), ...shuffle(DECK.map(w => w.id).filter(id => ok(id) && !this.words.includes(id)), this.rng)];
    return { word, cardType: 'imagen_estimulo', options: shuffle([word, ...pool.slice(0, n - 1)], this.rng), presentFirst: false, repeat };
  }
  /** null al agotar tiempo o ensayos, o si no hay palabras dominadas. */
  next(elapsedMs: number): TrialSpec | null {
    if (!this.available || elapsedMs >= this.limitMs || this.count >= this.maxTrials) return null;
    const q = this.queue.shift(); if (q) { this.last = q.word; return q; }
    let c = this.words.filter(w => w !== this.last); if (!c.length) c = this.words;
    this.last = c[Math.floor(this.rng() * c.length)];
    return this.build(this.last);
  }
  record(spec: TrialSpec, correct: boolean) {
    this.count++;
    if (!correct && !spec.repeat) this.queue.push(this.build(spec.word, true));
  }
}
