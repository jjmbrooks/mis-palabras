import { describe, it, expect, afterEach } from 'vitest';
import { distractors, isVeryDifferent, Session, wordStates, seenWords, lockedWord, type WordState } from '../../src/engine';
import { DECKS, DECK, WORDS, useDeck, wordById, SYLLABLES, LENGTH_OVERRIDE, isLong } from '../../src/deck';
import { FACTS, FACT_SOURCES } from '../../src/facts';
import { ANIMAL_SOUNDS } from '../../src/audio';

const seeded = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
afterEach(() => useDeck('abejas-jardin'));

/** Palabras sin distractor «muy distinto» en su mazo (N1) y sin dos (N2). Documentado en docs/mazos-nuevos.md. */
const gaps = (deck: string) => {
  const d = DECKS.find(x => x.id === deck)!; useDeck(deck);
  const n = (w: string) => d.words.filter(o => o !== w && isVeryDifferent(o, w)).length;
  return { n1: d.words.filter(w => n(w) === 0).map(w => wordById(w).text), n2: d.words.filter(w => n(w) === 1).map(w => wordById(w).text) };
};

describe('mazos nuevos', () => {
  it('cuatro mazos con las palabras pedidas', () => {
    const t = (id: string) => DECKS.find(d => d.id === id)!.words.map(w => wordById(w).text).join(' ');
    expect(t('animales')).toBe('PERRO GATO VACA PATO LEÓN OSO PEZ MONO CERDO BURRO TORTUGA JIRAFA ELEFANTE CABALLO GALLINA');
    expect(t('cumpleanos')).toBe('PASTEL PIÑATA GLOBO VELA REGALO DULCES GORRO GELATINA AMIGOS');
    expect(t('navidad')).toBe('ÁRBOL ESTRELLA REGALO PIÑATA BOTA ESFERA CAMPANA VELA NIEVE RENO SANTA');
  });
  it('REGALO, PIÑATA y VELA son una sola entrada compartida; NIEVE (copos) solo en Navidad', () => {
    expect(DECKS.find(d => d.id === 'navidad')!.words).toContain('nieve');
    expect(DECKS.find(d => d.id === 'cumpleanos')!.words).not.toContain('nieve');
    expect(WORDS.filter(w => w.id === 'nieve')).toHaveLength(1);
    for (const id of ['regalo', 'pinata', 'vela']) {
      expect(WORDS.filter(w => w.id === id)).toHaveLength(1);
      useDeck('cumpleanos'); const a = DECK.find(w => w.id === id);
      useDeck('navidad'); const b = DECK.find(w => w.id === id);
      expect(a).toBeDefined(); expect(a).toBe(b); // mismo objeto: mismo dibujo, mismo texto → mismo audio de palabra
    }
    expect(new Set(WORDS.map(w => w.id)).size).toBe(WORDS.length);
  });
  it('cada palabra tiene arte SVG autocontenido', () => {
    for (const w of WORDS) {
      expect(w.svg).toMatch(/^<svg [^>]*viewBox="0 0 200 200"/);
      expect(w.svg).not.toMatch(/href|<image|<text|https?:\/\/(?!www\.w3\.org)/);
    }
  });
  it('cada animal tiene sonido, dato curioso y fuente', () => {
    for (const id of DECKS.find(d => d.id === 'animales')!.words) {
      expect(ANIMAL_SOUNDS[id]?.length).toBeGreaterThan(0);
      expect(FACTS[id]).toBeTruthy();
      expect(FACT_SOURCES[id]).toMatch(/^https:\/\//);
    }
  });
  it('los distractores salen del mazo activo', () => {
    for (const d of DECKS) {
      useDeck(d.id); const rng = seeded(3);
      for (const w of d.words) for (const l of [1, 2, 3, 4] as const) for (const o of distractors(w, l, rng)) expect(d.words).toContain(o);
    }
  });
  it('N1 usa un distractor muy distinto siempre que el mazo lo tiene', () => {
    for (const d of DECKS) {
      useDeck(d.id);
      for (const w of d.words) {
        const has = d.words.some(o => o !== w && isVeryDifferent(o, w));
        for (let s = 1; s < 6; s++) { const [o] = distractors(w, 1, seeded(s)); if (has) expect(isVeryDifferent(o, w)).toBe(true); }
      }
    }
  });
  it('faltantes de contraste (lista documentada)', () => {
    expect(gaps('animales')).toEqual({ n1: [], n2: [] });
    expect(gaps('cumpleanos')).toEqual({ n1: ['GLOBO', 'GORRO'], n2: [] });
    expect(gaps('navidad')).toEqual({ n1: [], n2: [] });
    expect(gaps('abejas-jardin')).toEqual({ n1: ['MIEL', 'MAMÁ'], n2: ['FLOR', 'HOJA', 'AGUA', 'NUBE', 'RANA', 'CASA', 'PAPÁ'] });
  });
  it('una sesión con tutor funciona en cada mazo', () => {
    for (const d of DECKS) { useDeck(d.id); const s = new Session(wordStates([]), seeded(2)); expect(d.words).toContain(s.next()!.word); }
  });
  it('reserva de otros mazos: MIEL y MAMÁ en Abejas toman un distractor muy distinto ya visto', () => {
    useDeck('abejas-jardin');
    const seen = ['perro', 'tortuga', 'elefante', 'gato'];
    for (const w of ['miel', 'mama']) for (let s = 1; s < 8; s++) {
      const [o] = distractors(w, 1, seeded(s), undefined, seen);
      expect(isVeryDifferent(o, w)).toBe(true);
      expect(seen).toContain(o);
      const two = distractors(w, 2, seeded(s), undefined, seen);
      expect(two.every(x => isVeryDifferent(x, w))).toBe(true);
    }
  });
  it('GLOBO y GORRO en Cumpleaños toman un distractor muy distinto ya visto', () => {
    useDeck('cumpleanos');
    for (const w of ['globo', 'gorro']) for (let s = 1; s < 8; s++) {
      const [o] = distractors(w, 1, seeded(s), undefined, ['elefante', 'mariposa', 'pez']);
      expect(isVeryDifferent(o, w)).toBe(true);
    }
  });
  it('reserva: solo palabras ya vistas, solo si el mazo no alcanza, nunca en N3+', () => {
    useDeck('abejas-jardin');
    const all = WORDS.map(w => w.id);
    for (let s = 1; s < 8; s++) {
      expect(distractors('miel', 1, seeded(s))[0]).toMatch(/./); // sin vistas: se queda en el mazo
      expect(DECK.map(w => w.id)).toContain(distractors('miel', 1, seeded(s), undefined, [])[0]);
      // SOL tiene distractores muy distintos en su mazo: no se piden prestados
      expect(DECK.map(w => w.id)).toContain(distractors('sol', 1, seeded(s), undefined, all)[0]);
      for (const o of distractors('miel', 3, seeded(s), undefined, all)) expect(DECK.map(w => w.id)).toContain(o);
      // las vistas que no son muy distintas no se usan
      for (const o of distractors('mama', 1, seeded(s), undefined, ['mono', 'pato'])) expect(DECK.map(w => w.id)).toContain(o);
    }
    expect(seenWords([{ word: 'perro' }, { word: 'perro' }, { word: 'miel' }, { word: 'xyz' }] as never)).toEqual(['perro', 'miel']);
  });
  it('la sesión pasa las palabras vistas a los distractores', () => {
    useDeck('abejas-jardin');
    const st = wordStates([]);
    for (let s = 1; s < 30; s++) {
      const sess = new Session(st, seeded(s), undefined, ['miel', 'sol'], { knowsPictures: true, seen: ['elefante'] });
      const sp = sess.next()!;
      if (sp.word === 'miel' && sp.level === 1) { expect(sp.options).toContain('elefante'); return; }
    }
    throw new Error('no salió MIEL en N1');
  });
  it('cada palabra tiene sus sílabas; solo las de 4+ son largas y ABEJA siempre libre', () => {
    for (const w of WORDS) expect(SYLLABLES[w.id]).toBeGreaterThan(0);
    const long = WORDS.filter(w => isLong(w.id)).map(w => w.text).join(' ');
    expect(long).toBe('MARIPOSA ELEFANTE GELATINA');
    expect(isLong('abeja')).toBe(false); expect(isLong('jirafa')).toBe(false);
  });
  it('las largas se desbloquean al dominar (N4) todas las cortas del mazo', () => {
    useDeck('animales');
    const short = DECK.filter(w => !isLong(w.id)).map(w => w.id);
    const none = wordStates([]);
    expect(lockedWord('elefante', none)).toBe(true);
    expect(lockedWord('perro', none)).toBe(false);
    for (let s = 1; s < 20; s++) expect(isLong(new Session(none, seeded(s)).next()!.word)).toBe(false);
    const all = new Map<string, WordState>(short.map(id => [id, { level: 4, mastered: true, complete: false }]));
    expect(lockedWord('elefante', all)).toBe(false);
    const almost = new Map(all); almost.delete(short[0]);
    expect(lockedWord('elefante', almost)).toBe(true);
    // una larga que ya se empezó no se vuelve a bloquear
    almost.set('elefante', { level: 2, mastered: false, complete: false });
    expect(lockedWord('elefante', almost)).toBe(false);
  });
  it('el ajuste por palabra cambia el bloqueo', () => {
    useDeck('animales');
    LENGTH_OVERRIDE.elefante = 'corta'; LENGTH_OVERRIDE.perro = 'larga';
    try {
      expect(lockedWord('elefante', wordStates([]))).toBe(false);
      expect(lockedWord('perro', wordStates([]))).toBe(true);
    } finally { delete LENGTH_OVERRIDE.elefante; delete LENGTH_OVERRIDE.perro; }
  });
  it('las palabras nuevas salen de menos a más sílabas', () => {
    useDeck('animales');
    const sess = new Session(wordStates([]), seeded(1));
    const t = (sess as unknown as { targets: string[] }).targets;
    expect(t.every(id => SYLLABLES[id] <= 2)).toBe(true);
    expect(t).toContain('pez'); // la única de 1 sílaba va primero
  });
});
