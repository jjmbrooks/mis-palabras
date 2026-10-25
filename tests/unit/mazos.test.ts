import { describe, it, expect, afterEach } from 'vitest';
import { distractors, isVeryDifferent, Session, wordStates } from '../../src/engine';
import { DECKS, DECK, WORDS, useDeck, wordById } from '../../src/deck';
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
    expect(t('cumpleanos')).toBe('PASTEL PIÑATA GLOBO VELA REGALO DULCES GORRO FIESTA TACOS GELATINA NIEVE AMIGOS');
    expect(t('navidad')).toBe('ÁRBOL ESTRELLA REGALO NIEVE PIÑATA BOTA PONCHE BUÑUELO NACIMIENTO ESFERA CAMPANA VELA');
  });
  it('REGALO, NIEVE, PIÑATA y VELA son una sola entrada compartida', () => {
    for (const id of ['regalo', 'nieve', 'pinata', 'vela']) {
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
    expect(gaps('cumpleanos')).toEqual({ n1: ['GLOBO', 'GORRO'], n2: ['TACOS', 'NIEVE'] });
    expect(gaps('navidad')).toEqual({ n1: [], n2: [] });
    expect(gaps('abejas-jardin')).toEqual({ n1: ['MIEL', 'MAMÁ'], n2: ['FLOR', 'HOJA', 'AGUA', 'NUBE', 'RANA', 'CASA', 'PAPÁ'] });
  });
  it('una sesión con tutor funciona en cada mazo', () => {
    for (const d of DECKS) { useDeck(d.id); const s = new Session(wordStates([]), seeded(2)); expect(d.words).toContain(s.next()!.word); }
  });
});
