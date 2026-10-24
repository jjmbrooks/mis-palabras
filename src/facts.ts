// Premio final del modo independiente (D13): un dato curioso, como en un libro interactivo.
// Datos generales y comprobables, en frases cortas.
export const FACTS: Record<string, string> = {
  abeja: 'Las abejas bailan para contarles a sus amigas dónde hay flores.',
  miel: 'La miel la hacen las abejas con el néctar de las flores.',
  flor: 'Muchas flores huelen rico para llamar a las abejas.',
  sol: 'El Sol es una estrella. Nos da luz y calor.',
  panal: 'Las celdas del panal tienen seis lados.',
  hoja: 'Las hojas usan la luz del Sol para hacer comida para la planta.',
  arbol: 'Los árboles pueden vivir muchísimos años.',
  agua: 'Las plantas y los animales necesitan agua para vivir.',
  nube: 'Las nubes están hechas de gotitas de agua muy pequeñas.',
  rana: 'Las ranas pequeñas empiezan siendo renacuajos con cola.',
  mariposa: 'Las mariposas prueban el sabor con las patas.',
  casa: 'Algunos animales también construyen su casa, como las abejas.',
  pan: 'El pan se hace con harina, agua y un poco de sal.',
  mama: 'Mamá es una de las primeras palabras que dicen muchos bebés.',
  papa: 'Papá también es una de las primeras palabras de muchos bebés.',
};
export function rewardFact(words: string[], rng: () => number = Math.random): { word: string; fact: string } | null {
  const ws = words.filter(w => FACTS[w]);
  if (!ws.length) return null;
  const word = ws[Math.floor(rng() * ws.length)];
  return { word, fact: FACTS[word] };
}
