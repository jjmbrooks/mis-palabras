import { describe, it, expect } from 'vitest';
import { Session, wordStates, nextHelp, toCSV, TrialRecord } from '../../src/engine';
import { DECK, SIMILAR } from '../../src/deck';

const seeded = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const tr = (word: string, sessionId: string, correct: boolean, at: number, cardType: TrialRecord['cardType'] = 'imagen_texto'): TrialRecord =>
  ({ childId: 'c', sessionId, word, cardType, help: correct ? 'ninguna' : 'A', correct, latencyMs: 1000, at });

describe('mazo', () => {
  it('tiene las 15 palabras del documento', () => {
    expect(DECK.map(w => w.text)).toEqual(['ABEJA','MIEL','FLOR','SOL','PANAL','HOJA','ÁRBOL','AGUA','NUBE','RANA','MARIPOSA','CASA','PAN','MAMÁ','PAPÁ']);
  });
});

describe('sesión', () => {
  it('empieza con 2 opciones, mezcla, incluye la correcta y evita pares parecidos', () => {
    const s = new Session(wordStates([]), seeded(3));
    const t = s.next()!;
    expect(t.options).toHaveLength(2);
    expect(t.options).toContain(t.word);
    for (const o of t.options) expect(SIMILAR.some(([a, b]) => (a === o && b === t.word) || (b === o && a === t.word))).toBe(false);
  });
  it('pasa a 3 opciones cuando la palabra supera el 80 %', () => {
    const s = new Session(wordStates([]), seeded(5));
    const t = s.next()!; s.record(t, true); s.record({ ...t }, true);
    expect(s.optionCount(t.word)).toBe(3);
  });
  it('2 a 4 objetivos y entre 12 y 15 ensayos, termina en acierto', () => {
    for (let seed = 1; seed < 30; seed++) {
      const rng = seeded(seed); const s = new Session(wordStates([]), rng);
      expect(s.targets.length).toBeGreaterThanOrEqual(2); expect(s.targets.length).toBeLessThanOrEqual(4);
      let t, last = true;
      while ((t = s.next())) { last = rng() > 0.3; s.record(t, last); }
      expect(s.count).toBeGreaterThanOrEqual(12); expect(s.count).toBeLessThanOrEqual(15);
      if (s.count < 15) expect(last).toBe(true);
    }
  });
  it('tras un error repite la palabra y luego intercala una conocida', () => {
    const s = new Session(wordStates([]), seeded(9));
    const t = s.next()!; s.record(t, false);
    const r = s.next()!; expect(r.word).toBe(t.word); expect(r.repeat).toBe(true);
  });
});

describe('dominio', () => {
  it('sube de nivel con ≥90 % en 2 sesiones seguidas y baja con <60 %', () => {
    const h = [tr('miel', 's1', true, 1), tr('miel', 's2', true, 2)];
    expect(wordStates(h).get('miel')!.level).toBe(1);
    const h2 = [...h, tr('miel', 's3', false, 3, 'emparejar'), tr('miel', 's4', false, 4, 'emparejar')];
    expect(wordStates(h2).get('miel')!.level).toBe(0);
  });
  it('se domina tras el nivel solo texto', () => {
    const h = ['imagen_texto', 'imagen_texto', 'emparejar', 'emparejar', 'solo_texto', 'solo_texto']
      .map((c, i) => tr('sol', 's' + i, true, i, c as TrialRecord['cardType']));
    expect(wordStates(h).get('sol')!.mastered).toBe(true);
  });
  it('ayuda escalonada A→B→C', () => { expect([nextHelp('ninguna'), nextHelp('A'), nextHelp('B'), nextHelp('C')]).toEqual(['A','B','C','C']); });
  it('CSV con cabecera y escape', () => { expect(toCSV([tr('miel','s',true,0)]).split('\n')[0]).toBe('childId,sessionId,word,cardType,help,correct,latencyMs,at'); });
});
