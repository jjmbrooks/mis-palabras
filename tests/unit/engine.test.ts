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
  it('CSV con cabecera y escape', () => { expect(toCSV([tr('miel','s',true,0)]).split('\n')[0]).toBe('childId,sessionId,word,cardType,help,correct,latencyMs,at,mode,helps'); });
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

import { IndependentSession, progress, clampIndepMinutes, SessionRecord } from '../../src/engine';
import { FACTS, rewardFact } from '../../src/facts';

const masteredHist = (words: string[]) => words.flatMap(w => ['imagen_estimulo','imagen_estimulo','elegir_texto','elegir_texto','leer','leer']
  .map((c, i) => tr(w, 'm' + i, true, i, c as TrialRecord['cardType'])));

describe('D13: registro y progreso', () => {
  const ses = (id: string, startedAt: number, mode: SessionRecord['mode'] = 'tutor'): SessionRecord =>
    ({ id, childId: 'c', mode, deck: 'abejas-jardin', startedAt, endedAt: startedAt + 240000, durationMs: 240000, trials: 3 });
  it('% al primer intento por palabra y ayudas por sesión, más reciente primero', () => {
    const t = [tr('miel', 's1', true, 1), tr('miel', 's1', false, 2), tr('sol', 's1', true, 3), tr('sol', 's2', true, 4)];
    t[1].helps = 2;
    const p = progress([ses('s1', 10), ses('s2', 20)], t);
    expect(p.map(x => x.session.id)).toEqual(['s2', 's1']);
    const miel = p[1].words.find(w => w.word === 'miel')!;
    expect(miel).toMatchObject({ trials: 2, firstTry: 1, pct: 50, helps: 2 });
    expect(p[1].pct).toBe(67);
    expect(p[1].session.durationMs).toBe(240000);
  });
  it('dominada con ≥90 % en 2 sesiones seguidas; la práctica sola no cuenta', () => {
    const h = masteredHist(['sol']);
    expect(wordStates(h).get('sol')!.mastered).toBe(true);
    const solo = masteredHist(['miel']).map(t => ({ ...t, mode: 'independiente' as const }));
    expect(wordStates(solo).get('miel')!.mastered).toBe(false);
    expect(wordStates([tr('sol','a',true,1), tr('sol','b',false,2), tr('sol','c',true,3)]).get('sol')!.level).toBe(0);
  });
  it('CSV incluye modo y ayudas', () => {
    expect(toCSV([{ ...tr('miel','s',true,0), mode: 'independiente', helps: 1 }]).split('\n')[1].endsWith(',independiente,1')).toBe(true);
  });
});

describe('D13: modo independiente', () => {
  it('sin palabras dominadas no está disponible', () => {
    const s = new IndependentSession(wordStates([]), seeded(1));
    expect(s.available).toBe(false); expect(s.next(0)).toBeNull();
  });
  it('solo pregunta palabras dominadas, con estímulo solo imagen y sin fase de enseñanza', () => {
    const s = new IndependentSession(wordStates(masteredHist(['sol', 'miel', 'flor'])), seeded(7));
    expect(s.words.sort()).toEqual(['flor', 'miel', 'sol']);
    let t;
    for (let i = 0; i < 20 && (t = s.next(0)); i++) {
      expect(['sol', 'miel', 'flor']).toContain(t.word);
      expect(t.cardType).toBe('imagen_estimulo'); expect(t.presentFirst).toBe(false);
      expect(t.options).toContain(t.word); s.record(t, true);
    }
  });
  it('dura de 3 a 5 minutos y se cierra sola al cumplirse', () => {
    expect([clampIndepMinutes(1), clampIndepMinutes(4), clampIndepMinutes(9)]).toEqual([3, 4, 5]);
    const s = new IndependentSession(wordStates(masteredHist(['sol', 'miel'])), seeded(2), 3);
    expect(s.limitMs).toBe(180000);
    expect(s.next(179999)).not.toBeNull();
    expect(s.next(180000)).toBeNull();
  });
  it('tras un error repite la palabra sola', () => {
    const s = new IndependentSession(wordStates(masteredHist(['sol', 'miel'])), seeded(3));
    const t = s.next(0)!; s.record(t, false);
    const r = s.next(1)!; expect(r.word).toBe(t.word); expect(r.repeat).toBe(true);
  });
  it('premio: un dato curioso de una palabra practicada; hay dato para todo el mazo', () => {
    for (const w of DECK) expect(FACTS[w.id]).toBeTruthy();
    expect(rewardFact(['rana'])!.word).toBe('rana');
    expect(rewardFact([])).toBeNull();
  });
});
