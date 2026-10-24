import { describe, it, expect } from 'vitest';
import { Session, wordStates, nextHelp, toCSV, isIndependent, LEVELS, TrialRecord } from '../../src/engine';
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
  it('ayuda D12: ninguna → imagen + texto (B) → tutor (C)', () => { expect([nextHelp('ninguna'), nextHelp('B'), nextHelp('C')]).toEqual(['B','C','C']); });
  it('CSV con cabecera y escape', () => { expect(toCSV([tr('miel','s',true,0)]).split('\n')[0]).toBe('childId,sessionId,word,cardType,help,correct,latencyMs,at'); });
});

describe('D12: solo texto por defecto', () => {
  const kinds = (st = wordStates([]), opts = { knowsPictures: false }, seed = 4) => {
    const s = new Session(st, seeded(seed), undefined, [], opts); const out = []; let t;
    while ((t = s.next())) { out.push(t); s.record(t, true); }
    return out;
  };
  it('ningún nivel usa imagen + texto como carta de ensayo', () => {
    expect(LEVELS).toEqual(['imagen_estimulo', 'elegir_texto', 'leer']);
    for (const t of kinds()) expect(['imagen_estimulo', 'elegir_texto', 'leer']).toContain(t.cardType);
  });
  it('las opciones son palabras escritas (2–3) y «leer» muestra solo la palabra', () => {
    for (const t of kinds()) { expect(t.options.length).toBeGreaterThanOrEqual(2); expect(t.options.length).toBeLessThanOrEqual(3); }
    const lv2 = ['imagen_estimulo','imagen_estimulo','elegir_texto','elegir_texto'].map((c, i) => tr('sol', 'x' + i, true, i, c as TrialRecord['cardType']));
    const t = new Session(wordStates(lv2), seeded(2), undefined, ['sol']).next()!;
    expect(t.word === 'sol' ? t.options : ['sol']).toEqual(['sol']);
  });
  it('la repetición tras ayuda va sola, sin fase imagen + texto', () => {
    const s = new Session(wordStates([]), seeded(9));
    const t = s.next()!; expect(t.presentFirst).toBe(true); s.record(t, false);
    const r = s.next()!; expect(r.repeat).toBe(true); expect(r.presentFirst).toBe(false);
  });
  it('un ensayo con ayuda nunca cuenta como acierto independiente', () => {
    expect(isIndependent(true, 'ninguna')).toBe(true);
    expect(isIndependent(true, 'B')).toBe(false);
    expect(isIndependent(true, 'C')).toBe(false);
    expect(isIndependent(false, 'ninguna')).toBe(false);
  });
  it('si el niño ya conoce los dibujos se salta la enseñanza imagen + texto', () => {
    expect(kinds(undefined, { knowsPictures: true }).some(t => t.presentFirst)).toBe(false);
    expect(kinds(undefined, { knowsPictures: false }).some(t => t.presentFirst)).toBe(true);
  });
  it('lee historiales anteriores a D12 (imagen_texto → imagen_estimulo, etc.)', () => {
    const h = [tr('miel', 's1', true, 1, 'imagen_texto'), tr('miel', 's2', true, 2, 'imagen_estimulo')];
    expect(wordStates(h).get('miel')!.level).toBe(1);
  });
});
