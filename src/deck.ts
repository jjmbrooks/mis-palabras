// Mazo «Abejas y jardín» (docs/mecanica-inicial.md §6).
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

const W: [string, string][] = [['abeja', 'ABEJA'], ['miel', 'MIEL'], ['flor', 'FLOR'], ['sol', 'SOL'], ['panal', 'PANAL'], ['hoja', 'HOJA'], ['arbol', 'ÁRBOL'], ['agua', 'AGUA'], ['nube', 'NUBE'], ['rana', 'RANA'], ['mariposa', 'MARIPOSA'], ['casa', 'CASA'], ['pan', 'PAN'], ['mama', 'MAMÁ'], ['papa', 'PAPÁ']];
export const DECK: Word[] = W.map(([id, text]) => ({ id, text, svg: prefix(ART[`./art/${id}.svg`], id) }));

// Pares de forma parecida que se evitan juntos al inicio (§6).
export const SIMILAR: [string, string][] = [['pan', 'panal'], ['mama', 'papa']];

export const wordById = (id: string) => DECK.find(w => w.id === id)!;
export const svgFor = (w: Word) => w.svg.replace('<svg ', `<svg role="img" aria-label="${w.text}" `);
