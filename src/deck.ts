// Mazos: «Abejas y jardín» (docs/mecanica-inicial.md §6), Animales, Cumpleaños y Navidad (docs/mazos-nuevos.md).
// Arte: SVG vectorial original escrito por código, sin IA generativa ni referencias externas
// (ABEJA, MIEL y FLOR por Diversa; las otras 12 por Codelius). Ver docs/estilo-mazo-abejas.md.

const ART = import.meta.glob('./art/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface Word {
  id: string;
  text: string; // como se muestra (mayúsculas, con acentos)
  svg: string; // SVG completo (viewBox 0 0 200 200)
}

// Prefija los id internos (degradados) con el id de la palabra para que no choquen en la misma pantalla.
const prefix = (svg: string, k: string) =>
  svg.replace(/id="([\w-]+)"/g, `id="${k}__$1"`).replace(/url\(#([\w-]+)\)/g, `url(#${k}__$1)`);

// Registro único de palabras (mazos nuevos, oct-2026): cada palabra existe UNA vez aunque esté en varios mazos
// (REGALO, PIÑATA y VELA son la misma entrada en Cumpleaños y Navidad: mismo id, dibujo, historial y audio,
// porque la voz dice el mismo texto). ÁRBOL de Navidad es una entrada aparte (arbol_navidad: otro dibujo, mismo audio).
const W: [string, string][] = [['abeja', 'ABEJA'], ['miel', 'MIEL'], ['flor', 'FLOR'], ['sol', 'SOL'], ['panal', 'PANAL'], ['hoja', 'HOJA'], ['arbol', 'ÁRBOL'], ['agua', 'AGUA'], ['nube', 'NUBE'], ['rana', 'RANA'], ['mariposa', 'MARIPOSA'], ['casa', 'CASA'], ['pan', 'PAN'], ['mama', 'MAMÁ'], ['papa', 'PAPÁ'],
  // Animales
  ['perro', 'PERRO'], ['gato', 'GATO'], ['vaca', 'VACA'], ['pato', 'PATO'], ['leon', 'LEÓN'], ['oso', 'OSO'], ['pez', 'PEZ'], ['mono', 'MONO'], ['cerdo', 'CERDO'], ['burro', 'BURRO'], ['tortuga', 'TORTUGA'], ['jirafa', 'JIRAFA'], ['elefante', 'ELEFANTE'], ['caballo', 'CABALLO'], ['gallina', 'GALLINA'],
  // Cumpleaños
  ['pastel', 'PASTEL'], ['pinata', 'PIÑATA'], ['globo', 'GLOBO'], ['vela', 'VELA'], ['regalo', 'REGALO'], ['dulces', 'DULCES'], ['gorro', 'GORRO'], ['gelatina', 'GELATINA'], ['amigos', 'AMIGOS'],
  // Navidad (además de regalo, pinata y vela)
  ['arbol_navidad', 'ÁRBOL'], ['estrella', 'ESTRELLA'], ['bota', 'BOTA'], ['esfera', 'ESFERA'], ['campana', 'CAMPANA'], ['nieve', 'NIEVE'], ['reno', 'RENO'], ['santa', 'SANTA']];
export const WORDS: Word[] = W.map(([id, text]) => ({ id, text, svg: prefix(ART[`./art/${id}.svg`], id) }));

export interface DeckDef { id: string; name: string; words: string[]; similar: [string, string][] }
export const DECKS: DeckDef[] = [
  { id: 'abejas-jardin', name: 'Abejas y jardín', words: W.slice(0, 15).map(w => w[0]), similar: [['pan', 'panal'], ['mama', 'papa']] },
  { id: 'animales', name: 'Animales', words: ['perro', 'gato', 'vaca', 'pato', 'leon', 'oso', 'pez', 'mono', 'cerdo', 'burro', 'tortuga', 'jirafa', 'elefante', 'caballo', 'gallina'],
    similar: [['gato', 'pato'], ['perro', 'cerdo'], ['mono', 'oso']] },
  { id: 'cumpleanos', name: 'Cumpleaños', words: ['pastel', 'pinata', 'globo', 'vela', 'regalo', 'dulces', 'gorro', 'gelatina', 'amigos'], similar: [['globo', 'gorro']] },
  { id: 'navidad', name: 'Navidad', words: ['arbol_navidad', 'estrella', 'regalo', 'pinata', 'bota', 'esfera', 'campana', 'vela', 'nieve', 'reno', 'santa'], similar: [['estrella', 'esfera'], ['bota', 'vela']] },
];
/** Sílabas de cada palabra (división en español; hiatos: LE-ÓN). */
export const SYLLABLES: Record<string, number> = {
  abeja: 3, miel: 1, flor: 1, sol: 1, panal: 2, hoja: 2, arbol: 2, agua: 2, nube: 2, rana: 2, mariposa: 4, casa: 2, pan: 1, mama: 2, papa: 2,
  perro: 2, gato: 2, vaca: 2, pato: 2, leon: 2, oso: 2, pez: 1, mono: 2, cerdo: 2, burro: 2, tortuga: 3, jirafa: 3, elefante: 4, caballo: 3, gallina: 3,
  pastel: 2, pinata: 3, globo: 2, vela: 2, regalo: 3, dulces: 2, gorro: 2, gelatina: 4, amigos: 3,
  arbol_navidad: 2, estrella: 3, bota: 2, esfera: 3, campana: 3, nieve: 2, reno: 2, santa: 2,
};
/** Ajuste por palabra (lo confirma el tutor): 'corta' la deja libre aunque tenga 3+ sílabas; 'larga' la bloquea aunque sea corta.
 *  Por defecto, las palabras de 4+ sílabas quedan bloqueadas hasta dominar (N4) todas las de 1–3 sílabas del mazo. ABEJA siempre libre. */
export const LENGTH_OVERRIDE: Record<string, 'corta' | 'larga'> = { abeja: 'corta' };
export const isLong = (id: string) => LENGTH_OVERRIDE[id] ? LENGTH_OVERRIDE[id] === 'larga' : (SYLLABLES[id] ?? 1) >= 4;
export const deckById = (id: string) => DECKS.find(d => d.id === id);

// Mazo activo: el motor y la interfaz leen DECK y SIMILAR; useDeck cambia su contenido en su lugar.
export const DECK: Word[] = [];
export const SIMILAR: [string, string][] = [];
let active = DECKS[0];
export const activeDeck = () => active;
export function useDeck(id: string): DeckDef {
  active = deckById(id) ?? DECKS[0];
  DECK.splice(0, DECK.length, ...active.words.map(w => WORDS.find(x => x.id === w)!));
  SIMILAR.splice(0, SIMILAR.length, ...active.similar);
  return active;
}
useDeck(DECKS[0].id);

export const wordById = (id: string) => WORDS.find(w => w.id === id)!;
export const svgFor = (w: Word) => w.svg.replace('<svg ', `<svg role="img" aria-label="${w.text}" `);
