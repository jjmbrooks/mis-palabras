// Mazo «Abejas y jardín» (docs/mecanica-inicial.md §6).
// Ilustraciones ORIGINALES hechas con código (SVG) para este repositorio.
// Origen documentado en docs/ARQUITECTURA.md («Arte»). Licencia MIT, como el resto.

export interface Word {
  id: string;
  text: string; // como se muestra (mayúsculas, con acentos)
  svg: string; // contenido interno de un <svg viewBox="0 0 100 100">
}

const face = (cx: number, cy: number) =>
  `<circle cx="${cx - 5}" cy="${cy}" r="2" fill="#3b3b3b"/><circle cx="${cx + 5}" cy="${cy}" r="2" fill="#3b3b3b"/><path d="M${cx - 5} ${cy + 6} q5 4 10 0" stroke="#3b3b3b" stroke-width="2" fill="none"/>`;

const person = (hair: string, extra: string) =>
  `<rect x="30" y="58" width="40" height="34" rx="14" fill="#8fb8de"/>` +
  `<circle cx="50" cy="40" r="20" fill="#f2c9a0"/>${hair}${face(50, 40)}${extra}`;

export const DECK: Word[] = [
  { id: 'abeja', text: 'ABEJA', svg:
    `<ellipse cx="38" cy="34" rx="14" ry="10" fill="#dfeffb" stroke="#9cc3e0" stroke-width="2"/>` +
    `<ellipse cx="60" cy="32" rx="14" ry="10" fill="#dfeffb" stroke="#9cc3e0" stroke-width="2"/>` +
    `<ellipse cx="50" cy="58" rx="28" ry="20" fill="#f6c945"/>` +
    `<rect x="40" y="39" width="7" height="38" fill="#4a4036"/><rect x="55" y="39" width="7" height="38" fill="#4a4036"/>` +
    `<circle cx="74" cy="55" r="4" fill="#4a4036"/>` },
  { id: 'miel', text: 'MIEL', svg:
    `<path d="M28 40 h44 l-4 48 h-36 z" fill="#f2a93b"/><rect x="26" y="30" width="48" height="12" rx="4" fill="#c98a2e"/>` +
    `<path d="M32 50 q8 10 0 18" stroke="#ffd98a" stroke-width="4" fill="none"/><rect x="47" y="10" width="6" height="26" rx="3" fill="#9a6b3a"/>` },
  { id: 'flor', text: 'FLOR', svg:
    `<rect x="48" y="50" width="4" height="44" fill="#5aa05a"/><ellipse cx="62" cy="76" rx="10" ry="5" fill="#5aa05a"/>` +
    [0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="20" rx="10" ry="16" fill="#f28fb0" transform="rotate(${a} 50 38)"/>`).join('') +
    `<circle cx="50" cy="38" r="10" fill="#f6c945"/>` },
  { id: 'sol', text: 'SOL', svg:
    [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="47" y="4" width="6" height="16" rx="3" fill="#f6b93b" transform="rotate(${a} 50 50)"/>`).join('') +
    `<circle cx="50" cy="50" r="24" fill="#f6c945"/>${face(50, 48)}` },
  { id: 'panal', text: 'PANAL', svg:
    [[34, 30], [56, 30], [23, 49], [45, 49], [67, 49], [34, 68], [56, 68]].map(([x, y]) =>
      `<polygon points="${x},${y - 11} ${x + 10},${y - 5.5} ${x + 10},${y + 5.5} ${x},${y + 11} ${x - 10},${y + 5.5} ${x - 10},${y - 5.5}" fill="#f6c945" stroke="#c98a2e" stroke-width="2" transform="translate(5 0)"/>`).join('') },
  { id: 'hoja', text: 'HOJA', svg:
    `<path d="M50 90 C10 70 15 25 50 10 C85 25 90 70 50 90 z" fill="#6cbf6c"/><path d="M50 90 V18" stroke="#3f8a3f" stroke-width="3"/>` +
    `<path d="M50 40 l-14 -8 M50 55 l16 -10 M50 70 l-16 -8" stroke="#3f8a3f" stroke-width="2"/>` },
  { id: 'arbol', text: 'ÁRBOL', svg:
    `<rect x="43" y="56" width="14" height="38" fill="#9a6b3a"/><circle cx="50" cy="38" r="28" fill="#5aa05a"/>` +
    `<circle cx="32" cy="48" r="14" fill="#6cbf6c"/><circle cx="68" cy="48" r="14" fill="#6cbf6c"/>` },
  { id: 'agua', text: 'AGUA', svg:
    `<path d="M50 8 C40 30 24 46 24 62 a26 26 0 0 0 52 0 C76 46 60 30 50 8 z" fill="#6fb3e6"/>` +
    `<path d="M38 62 a12 12 0 0 0 10 12" stroke="#dff0fb" stroke-width="4" fill="none"/>` },
  { id: 'nube', text: 'NUBE', svg:
    `<circle cx="36" cy="56" r="16" fill="#e8eef5"/><circle cx="54" cy="44" r="20" fill="#e8eef5"/><circle cx="70" cy="58" r="14" fill="#e8eef5"/>` +
    `<rect x="22" y="56" width="60" height="16" rx="8" fill="#e8eef5"/><path d="M22 56 a16 16 0 0 1 14-16" stroke="#b9c7d6" stroke-width="2" fill="none"/>` },
  { id: 'rana', text: 'RANA', svg:
    `<ellipse cx="50" cy="62" rx="32" ry="22" fill="#6cbf6c"/><circle cx="36" cy="38" r="10" fill="#6cbf6c"/><circle cx="64" cy="38" r="10" fill="#6cbf6c"/>` +
    `<circle cx="36" cy="38" r="5" fill="#fff"/><circle cx="64" cy="38" r="5" fill="#fff"/><circle cx="36" cy="38" r="2.5" fill="#333"/><circle cx="64" cy="38" r="2.5" fill="#333"/>` +
    `<path d="M38 64 q12 8 24 0" stroke="#3f8a3f" stroke-width="3" fill="none"/>` },
  { id: 'mariposa', text: 'MARIPOSA', svg:
    `<ellipse cx="32" cy="38" rx="18" ry="20" fill="#b48fe0"/><ellipse cx="68" cy="38" rx="18" ry="20" fill="#b48fe0"/>` +
    `<ellipse cx="35" cy="68" rx="13" ry="14" fill="#f28fb0"/><ellipse cx="65" cy="68" rx="13" ry="14" fill="#f28fb0"/>` +
    `<rect x="46" y="26" width="8" height="56" rx="4" fill="#4a4036"/><path d="M48 26 l-8 -14 M52 26 l8 -14" stroke="#4a4036" stroke-width="2"/>` },
  { id: 'casa', text: 'CASA', svg:
    `<rect x="22" y="46" width="56" height="44" fill="#f4d9b0"/><polygon points="14,48 50,16 86,48" fill="#d9674e"/>` +
    `<rect x="44" y="64" width="14" height="26" fill="#9a6b3a"/><rect x="28" y="56" width="11" height="11" fill="#8fc6ea"/><rect x="63" y="56" width="11" height="11" fill="#8fc6ea"/>` },
  { id: 'pan', text: 'PAN', svg:
    `<path d="M16 62 C16 36 84 36 84 62 v10 a6 6 0 0 1 -6 6 h-56 a6 6 0 0 1 -6 -6 z" fill="#e0a75e"/>` +
    `<path d="M34 46 l6 12 M50 43 l0 13 M66 46 l-6 12" stroke="#b97c3a" stroke-width="3"/>` },
  { id: 'mama', text: 'MAMÁ', svg: person(
    `<path d="M28 42 C26 14 74 14 72 42 C72 30 60 24 50 24 C40 24 28 30 28 42 z" fill="#7a4a2a"/><path d="M28 42 v26 h8 v-26 z M72 42 v26 h-8 v-26 z" fill="#7a4a2a"/>`,
    `<circle cx="50" cy="72" r="4" fill="#f28fb0"/>`) },
  { id: 'papa', text: 'PAPÁ', svg: person(
    `<path d="M30 36 C30 16 70 16 70 36 C64 28 36 28 30 36 z" fill="#3b3b3b"/>`,
    `<rect x="47" y="60" width="6" height="18" fill="#d9674e"/>`) },
];

// Pares de forma parecida que se evitan juntos al inicio (§6).
export const SIMILAR: [string, string][] = [['pan', 'panal'], ['mama', 'papa']];

export const wordById = (id: string) => DECK.find(w => w.id === id)!;
export const svgFor = (w: Word) =>
  `<svg viewBox="0 0 100 100" role="img" aria-label="${w.text}" xmlns="http://www.w3.org/2000/svg">${w.svg}</svg>`;
