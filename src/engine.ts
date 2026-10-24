// Lógica pura del Modo con tutor (docs/mecanica-inicial.md). Sin DOM ni Firebase: probada en tests/unit.
import { DECK, SIMILAR } from './deck';

export type CardType = 'imagen_texto' | 'emparejar' | 'solo_texto';
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
}

export const LEVELS: CardType[] = ['imagen_texto', 'emparejar', 'solo_texto'];
export const MASTER = 0.9; // ≥ 90 % (§5)
export const DROP = 0.6; // < ≈60 % (§5)

export interface WordState { level: number; mastered: boolean }

/** Nivel de apoyo de cada palabra a partir del historial (§5). */
export function wordStates(history: TrialRecord[]): Map<string, WordState> {
  const out = new Map<string, WordState>();
  const sorted = [...history].sort((a, b) => a.at - b.at);
  for (const w of DECK) {
    const trials = sorted.filter(t => t.word === w.id);
    const sessions: string[] = [];
    for (const t of trials) if (!sessions.includes(t.sessionId)) sessions.push(t.sessionId);
    let level = 0, mastered = false, hi = 0, lo = 0;
    for (const s of sessions) {
      const ts = trials.filter(t => t.sessionId === s && t.cardType === LEVELS[level]);
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
  options: string[]; // ya mezcladas
  presentFirst: boolean; // mostrar la carta de presentación antes (§3.1)
  repeat: boolean; // repetición tras ayuda
}

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
              readonly cfg: SessionConfig = DEFAULT_CONFIG, preferred: string[] = []) {
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
    const n = this.optionCount(word);
    const pool = shuffle(DECK.map(w => w.id).filter(id => id !== word && !similar(id, word)), this.rng);
    const options = shuffle([word, ...pool.slice(0, n - 1)], this.rng);
    const level = this.states.get(word)?.level ?? 0;
    const presentFirst = !this.presented.has(word) && !this.states.get(word)?.mastered;
    this.presented.add(word);
    return { word, cardType: LEVELS[level], options, presentFirst, repeat };
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

  /** Tras responder: si hubo ayuda, se repite el ensayo y luego una palabra conocida (§3.4). */
  record(spec: TrialSpec, correct: boolean) {
    this.done.push({ word: spec.word, correct });
    if (!correct && !spec.repeat) {
      this.queue.push(this.build(spec.word, true));
      const k = this.known.filter(w => w !== spec.word);
      this.queue.push(this.build((k.length ? k : this.known)[Math.floor(this.rng() * (k.length || this.known.length))]));
    }
  }
}

/** Siguiente nivel de ayuda (A → B → C), sin sonido negativo. */
export const nextHelp = (h: Help): Help => (h === 'ninguna' ? 'A' : h === 'A' ? 'B' : 'C');

export function toCSV(rows: TrialRecord[]): string {
  const head = ['childId', 'sessionId', 'word', 'cardType', 'help', 'correct', 'latencyMs', 'at'];
  const esc = (v: unknown) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [head.join(','), ...rows.map(r => [r.childId, r.sessionId, r.word, r.cardType, r.help, r.correct, r.latencyMs, new Date(r.at).toISOString()].map(esc).join(','))].join('\n');
}
