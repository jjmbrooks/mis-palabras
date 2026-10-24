import { describe, it, expect } from 'vitest';
import { Session, IndependentSession, wordStates, buildSpec, distractors, isVeryDifferent, isLookAlike,
  instructionFor, mentionsWord, INDEP_GOAL, Level, TrialRecord, WordState } from '../../src/engine';
import { DECK, wordById } from '../../src/deck';

const seeded = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
let clock = 0;
const t = (word: string, sessionId: string, correct: boolean, level?: Level, cardType: TrialRecord['cardType'] = level === 5 ? 'leer' : 'elegir_texto'): TrialRecord =>
  ({ childId: 'c', sessionId, word, cardType, help: correct ? 'ninguna' : 'B', correct, latencyMs: 900, at: ++clock, mode: 'tutor', level, miss: !correct });
/** n sesiones perfectas por nivel hasta llegar a `to` (3 ensayos por sesión). */
const climb = (word: string, to: Level) => {
  const out: TrialRecord[] = [];
  for (let l = 1; l < to; l++) for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) out.push(t(word, `${word}-${l}-${k}`, true, l as Level));
  return out;
};
const states = (levels: Record<string, Level>) => {
  const m = new Map<string, WordState>();
  for (const w of DECK) { const level = levels[w.id] ?? 1; m.set(w.id, { level, mastered: level >= 4, complete: false }); }
  return m;
};

describe('D16: niveles y avance', () => {
  it('empieza en N1 y sube con ≥90 % al primer intento en 2 sesiones seguidas', () => {
    expect(wordStates([]).get('miel')!.level).toBe(1);
    const one = [t('miel', 'a', true, 1), t('miel', 'a', true, 1)];
    expect(wordStates(one).get('miel')!.level).toBe(1); // 1 sola sesión no basta
    expect(wordStates([...one, t('miel', 'b', true, 1)]).get('miel')!.level).toBe(2);
    // una sesión floja en medio reinicia la racha
    const broken = [t('sol', 'a', true, 1), t('sol', 'b', true, 1), t('sol', 'b', false, 1), t('sol', 'b', true, 1), t('sol', 'c', true, 1)];
    expect(wordStates(broken).get('sol')!.level).toBe(1);
  });
  it('baja un nivel tras 2 fallos seguidos (también dentro de la sesión)', () => {
    const h = [...climb('flor', 3), t('flor', 'x', false, 3), t('flor', 'x', false, 3)];
    expect(wordStates(climb('flor', 3)).get('flor')!.level).toBe(3);
    expect(wordStates(h).get('flor')!.level).toBe(2);
    const notConsecutive = [...climb('flor', 3), t('flor', 'x', false, 3), t('flor', 'x', true, 3), t('flor', 'x', false, 3)];
    expect(wordStates(notConsecutive).get('flor')!.level).toBe(3);
    const s = new Session(states({ abeja: 3 }), seeded(4), undefined, ['abeja']);
    s.record(buildSpec('abeja', 3, seeded(1)), false); s.record(buildSpec('abeja', 3, seeded(1)), false);
    expect(s.levelOf('abeja')).toBe(2);
  });
  it('queda dominada al alcanzar N4; N5 superado = lee sola; la práctica sola no cuenta', () => {
    expect(wordStates(climb('agua', 3)).get('agua')!.mastered).toBe(false);
    expect(wordStates(climb('agua', 4)).get('agua')).toMatchObject({ level: 4, mastered: true, complete: false });
    const five = [...climb('sol', 5), ...[0, 1].flatMap(k => [t('sol', 'r' + k, true, 5), t('sol', 'r' + k, true, 5)])];
    expect(wordStates(five).get('sol')).toMatchObject({ level: 5, mastered: true, complete: true });
    const solo = climb('nube', 4).map(x => ({ ...x, mode: 'independiente' as const }));
    expect(wordStates(solo).get('nube')!.level).toBe(1);
  });
  it('migra historiales sin nivel de forma conservadora: elegir → N1, leer → N3, leer superado → N4 sin dominio', () => {
    const old = (w: string, kinds: TrialRecord['cardType'][]) => kinds.map((c, i) => ({ ...t(w, `${w}o${i}`, true), cardType: c, level: undefined, mode: undefined }));
    expect(wordStates(old('miel', ['imagen_estimulo'])).get('miel')).toMatchObject({ level: 1, mastered: false });
    expect(wordStates(old('miel', ['imagen_estimulo', 'elegir_texto'])).get('miel')).toMatchObject({ level: 3, mastered: false });
    const done = old('sol', ['imagen_texto', 'emparejar', 'leer', 'solo_texto']);
    expect(wordStates(done).get('sol')).toMatchObject({ level: 4, mastered: false, complete: false });
    // El dominio se verifica con el criterio nuevo: 2 sesiones ≥90 % en N4.
    const one = [...done, t('sol', 'v1', true, 4), t('sol', 'v1', true, 4)];
    expect(wordStates(one).get('sol')!.mastered).toBe(false);
    expect(wordStates([...one, t('sol', 'v2', true, 4)]).get('sol')).toMatchObject({ level: 5, mastered: true });
    // y quien estaba en leer sigue desde N3
    const cont = [...old('flor', ['elegir_texto', 'elegir_texto']), t('flor', 'n1', true, 3), t('flor', 'n2', true, 3)];
    expect(wordStates(cont).get('flor')).toMatchObject({ level: 4, mastered: true });
    // un N4 migrado sin verificar no abre «Practicar solo»
    expect(new IndependentSession(wordStates([...done, ...old('miel', ['imagen_texto','emparejar','leer','solo_texto']), ...old('flor', ['imagen_texto','emparejar','leer','solo_texto'])])).available).toBe(false);
  });
  it('para bajar solo cuentan los fallos al primer intento (pedir Ayuda o esperar no)', () => {
    const helpOnly = (sid: string): TrialRecord => ({ ...t('flor', sid, false, 3), help: 'B', miss: false });
    const missed = (sid: string): TrialRecord => ({ ...t('flor', sid, false, 3), help: 'B', miss: true });
    const base = climb('flor', 3);
    expect(wordStates([...base, helpOnly('x'), helpOnly('x'), helpOnly('x')]).get('flor')!.level).toBe(3);
    expect(wordStates([...base, missed('x'), helpOnly('x'), missed('x')]).get('flor')!.level).toBe(2);
    expect(wordStates([...base, missed('x'), t('flor', 'x', true, 3), missed('x')]).get('flor')!.level).toBe(3);
    const s = new Session(states({ abeja: 3 }), seeded(4), undefined, ['abeja']);
    s.record(buildSpec('abeja', 3, seeded(1)), false, false); s.record(buildSpec('abeja', 3, seeded(1)), false, false);
    expect(s.levelOf('abeja')).toBe(3);
    s.record(buildSpec('abeja', 3, seeded(1)), false, true); s.record(buildSpec('abeja', 3, seeded(1)), false, true);
    expect(s.levelOf('abeja')).toBe(2);
  });
});

describe('D16: forma del ensayo por nivel', () => {
  const rng = seeded(9);
  it('N1–N3 con dibujo y «Toca donde dice X»; N4 sin dibujo; N5 la palabra sola con «¿Qué dice aquí?»', () => {
    for (const l of [1, 2, 3, 4, 5] as Level[]) {
      const s = buildSpec('miel', l, rng);
      expect(s.picture).toBe(l <= 3);
      expect(s.cardType).toBe(l === 5 ? 'leer' : 'elegir_texto');
      expect(s.options.length).toBe(l === 1 ? 2 : l === 5 ? 1 : 3);
      expect(s.options).toContain('miel');
      const i = instructionFor(s.cardType, 'MIEL');
      expect(i.spoken).toBe(l === 5 ? '¿Qué dice aquí?' : 'Toca donde dice MIEL');
      if (l === 5) expect(mentionsWord(i.spoken, 'MIEL')).toBe(false);
    }
  });
  it('distractores por nivel: N1–N2 muy distintos; N3–N4 parecidos (misma inicial o longitud)', () => {
    for (const w of DECK) for (let seed = 1; seed < 6; seed++) {
      for (const l of [1, 2] as Level[]) for (const d of distractors(w.id, l, seeded(seed)))
        expect(isVeryDifferent(d, w.id) || !isLookAlike(d, w.id), `${l} ${w.id}/${d}`).toBe(true);
      for (const l of [3, 4] as Level[]) {
        const ds = distractors(w.id, l, seeded(seed));
        expect(ds.length).toBe(2);
        // el mazo tiene parecidas para casi todas; al menos la primera lo es
        expect(isLookAlike(ds[0], w.id), `${l} ${w.id}/${ds[0]}`).toBe(true);
      }
    }
    expect(distractors('pan', 3, seeded(1))).toContain('panal');
    expect(distractors('pan', 1, seeded(1))).not.toContain('panal');
  });
  it('la posición de la correcta varía (opciones mezcladas)', () => {
    const pos = new Set<number>();
    for (let seed = 1; seed < 40; seed++) pos.add(buildSpec('sol', 2, seeded(seed)).options.indexOf('sol'));
    expect(pos).toEqual(new Set([0, 1, 2]));
  });
});

describe('D16: Practicar solo', () => {
  const mastered = (ws: string[]) => states(Object.fromEntries(ws.map(w => [w, 4 as Level])));
  it('se abre solo con ≥3 palabras dominadas', () => {
    expect(new IndependentSession(mastered(['sol']), seeded(1)).available).toBe(false);
    expect(new IndependentSession(mastered(['sol']), seeded(1)).next(0)).toBeNull();
    expect(new IndependentSession(mastered(['sol', 'miel']), seeded(1)).available).toBe(false);
    expect(new IndependentSession(mastered(['sol', 'miel', 'flor']), seeded(1)).available).toBe(true);
  });
  it('nunca repite la misma palabra dos veces seguidas, ni tras un error; ensayos en N4 sin dibujo', () => {
    for (let seed = 1; seed < 25; seed++) {
      const rng = seeded(seed); const s = new IndependentSession(mastered(['sol', 'miel', 'flor']), rng);
      let last = '', x;
      for (let i = 0; i < 40 && (x = s.next(0)); i++) {
        expect(x.word).not.toBe(last); last = x.word;
        expect(x.level).toBe(4); expect(x.picture).toBe(false); expect(x.options.length).toBe(3);
        s.record(x, rng() > 0.4);
      }
    }
  });
  it(`termina a los ${INDEP_GOAL} aciertos o a los 4 min, lo que pase primero`, () => {
    const s = new IndependentSession(mastered(['sol', 'miel', 'flor']), seeded(3));
    let n = 0, x;
    while ((x = s.next(0))) { s.record(x, true); n++; }
    expect(n).toBe(INDEP_GOAL);
    const s2 = new IndependentSession(mastered(['sol', 'miel', 'flor']), seeded(3));
    expect(s2.limitMs).toBe(240000);
    s2.record(s2.next(0)!, true);
    expect(s2.next(239999)).not.toBeNull();
    expect(s2.next(240000)).toBeNull();
    // con errores también termina (tope de ensayos), nunca en bucle
    const s3 = new IndependentSession(mastered(['sol', 'miel', 'flor']), seeded(5)); let k = 0;
    while ((x = s3.next(0)) && k < 1000) { s3.record(x, false); k++; }
    expect(k).toBeLessThanOrEqual(30);
  });
  it('el error que motivó D16 (1 sola palabra dominada repetida 20 veces) ya no ocurre', () => {
    const s = new IndependentSession(mastered(['miel']), seeded(2));
    expect(s.next(0)).toBeNull();
  });
});

describe('D16: sesión con tutor', () => {
  it('nunca la misma palabra dos veces seguidas, también tras un error', () => {
    for (let seed = 1; seed < 30; seed++) {
      const rng = seeded(seed); const s = new Session(states({ sol: 4, miel: 5 }), rng);
      let last = '', x;
      while ((x = s.next())) { expect(x.word).not.toBe(last); last = x.word; s.record(x, rng() > 0.35); }
    }
  });
  it('tras un error la palabra vuelve después de otra, como repetición', () => {
    const s = new Session(states({}), seeded(9));
    const a = s.next()!; s.record(a, false);
    const b = s.next()!; expect(b.word).not.toBe(a.word); s.record(b, true);
    const c = s.next()!; expect(c.word).toBe(a.word); expect(c.repeat).toBe(true);
  });
  it('N5 solo con tutor; las palabras ya superadas en N5 no son objetivo', () => {
    const st = states({ sol: 5 }); st.set('sol', { level: 5, mastered: true, complete: true });
    const s = new Session(st, seeded(1));
    expect(s.targets).not.toContain('sol');
    const s2 = new Session(states({ abeja: 5 }), seeded(1), undefined, ['abeja']);
    expect(s2.targets).toContain('abeja');
    expect(buildSpec('abeja', s2.levelOf('abeja'), seeded(1)).cardType).toBe('leer');
  });
  it('ninguna palabra del mazo queda sin dibujo para la retroalimentación', () => {
    for (const w of DECK) expect(wordById(w.id).svg.length).toBeGreaterThan(50);
  });
});
