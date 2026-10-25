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
// (REGALO, NIEVE, PIÑATA y VELA son la misma entrada en Cumpleaños y Navidad: mismo id, dibujo, historial y audio,
// porque la voz dice el mismo texto). ÁRBOL de Navidad es una entrada aparte (arbol_navidad: otro dibujo, mismo audio).
const W: [string, string][] = [['abeja', 'ABEJA'], ['miel', 'MIEL'], ['flor', 'FLOR'], ['sol', 'SOL'], ['panal', 'PANAL'], ['hoja', 'HOJA'], ['arbol', 'ÁRBOL'], ['agua', 'AGUA'], ['nube', 'NUBE'], ['rana', 'RANA'], ['mariposa', 'MARIPOSA'], ['casa', 'CASA'], ['pan', 'PAN'], ['mama', 'MAMÁ'], ['papa', 'PAPÁ'],
  // Animales
  ['perro', 'PERRO'], ['gato', 'GATO'], ['vaca', 'VACA'], ['pato', 'PATO'], ['leon', 'LEÓN'], ['oso', 'OSO'], ['pez', 'PEZ'], ['mono', 'MONO'], ['cerdo', 'CERDO'], ['burro', 'BURRO'], ['tortuga', 'TORTUGA'], ['jirafa', 'JIRAFA'], ['elefante', 'ELEFANTE'], ['caballo', 'CABALLO'], ['gallina', 'GALLINA'],
  // Cumpleaños
  ['pastel', 'PASTEL'], ['pinata', 'PIÑATA'], ['globo', 'GLOBO'], ['vela', 'VELA'], ['regalo', 'REGALO'], ['dulces', 'DULCES'], ['gorro', 'GORRO'], ['fiesta', 'FIESTA'], ['tacos', 'TACOS'], ['gelatina', 'GELATINA'], ['nieve', 'NIEVE'], ['amigos', 'AMIGOS'],
  // Navidad (además de regalo, nieve, pinata y vela)
  ['arbol_navidad', 'ÁRBOL'], ['estrella', 'ESTRELLA'], ['bota', 'BOTA'], ['ponche', 'PONCHE'], ['bunuelo', 'BUÑUELO'], ['nacimiento', 'NACIMIENTO'], ['esfera', 'ESFERA'], ['campana', 'CAMPANA']];
export const WORDS: Word[] = W.map(([id, text]) => ({ id, text, svg: prefix(ART[`./art/${id}.svg`], id) }));

export interface DeckDef { id: string; name: string; words: string[]; similar: [string, string][] }
export const DECKS: DeckDef[] = [
  { id: 'abejas-jardin', name: 'Abejas y jardín', words: W.slice(0, 15).map(w => w[0]), similar: [['pan', 'panal'], ['mama', 'papa']] },
  { id: 'animales', name: 'Animales', words: ['perro', 'gato', 'vaca', 'pato', 'leon', 'oso', 'pez', 'mono', 'cerdo', 'burro', 'tortuga', 'jirafa', 'elefante', 'caballo', 'gallina'],
    similar: [['gato', 'pato'], ['perro', 'cerdo'], ['mono', 'oso']] },
  { id: 'cumpleanos', name: 'Cumpleaños', words: ['pastel', 'pinata', 'globo', 'vela', 'regalo', 'dulces', 'gorro', 'fiesta', 'tacos', 'gelatina', 'nieve', 'amigos'], similar: [['globo', 'gorro']] },
  { id: 'navidad', name: 'Navidad', words: ['arbol_navidad', 'estrella', 'regalo', 'nieve', 'pinata', 'bota', 'ponche', 'bunuelo', 'nacimiento', 'esfera', 'campana', 'vela'], similar: [['estrella', 'esfera'], ['bota', 'vela']] },
];
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
