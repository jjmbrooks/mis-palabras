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
  // Mazo Animales: un dato curioso comprobable por animal; la fuente de cada uno está en FACT_SOURCES y docs/mazos-nuevos.md.
  perro: 'El perro huele muchísimo mejor que las personas.',
  gato: 'Los bigotes del gato le ayudan a sentir lo que hay a su alrededor.',
  vaca: 'La vaca tiene un estómago con cuatro partes para digerir el pasto.',
  pato: 'El pato se arregla las plumas con un aceite que él mismo hace.',
  leon: 'El rugido del león se oye hasta a 8 kilómetros.',
  oso: 'Muchos osos duermen casi todo el invierno en su cueva.',
  pez: 'Los peces respiran bajo el agua con sus branquias.',
  mono: 'Algunos monos usan la cola como una mano para agarrarse de las ramas.',
  cerdo: 'El cerdo casi no suda; se revuelca en el lodo para refrescarse.',
  burro: 'Las orejas largas del burro le ayudan a oír lejos y a quitarse el calor.',
  tortuga: 'El caparazón de la tortuga es parte de sus huesos; no se lo puede quitar.',
  jirafa: 'La jirafa es el animal más alto de todos los que viven en tierra.',
  elefante: 'El elefante usa la trompa para oler, beber agua y agarrar cosas.',
  caballo: 'El caballo puede dormir de pie, sin caerse.',
  gallina: 'El pollito sale del huevo después de unos 21 días.',
};
// Fuente abierta y verificada (oct 2026) de cada dato del mazo Animales (D-mazos): se muestra en docs, no en la pantalla del niño.
export const FACT_SOURCES: Record<string, string> = {
  perro: 'https://www.pbs.org/wgbh/nova/article/dogs-sense-of-smell',
  gato: 'https://www.britannica.com/animal/cat',
  vaca: 'https://www.britannica.com/animal/ruminant',
  pato: 'https://www.britannica.com/science/preen-gland',
  leon: 'https://www.nationalgeographic.com/animals/mammals/facts/african-lion',
  oso: 'https://www.britannica.com/animal/bear',
  pez: 'https://www.nps.gov/articles/blue-in-the-face-breathing-underwater.htm',
  mono: 'https://www.britannica.com/animal/monkey',
  cerdo: 'https://extension.missouri.edu/news/sweating-like-a-pig',
  burro: 'https://nationalzoo.si.edu/animals/miniature-donkey',
  tortuga: 'https://www.britannica.com/animal/turtle-reptile',
  jirafa: 'https://www.britannica.com/animal/giraffe',
  elefante: 'https://www.britannica.com/animal/elephant-mammal',
  caballo: 'https://www.nationalgeographic.com/science/article/150711-animals-science-sleep-horses-bison-moose',
  gallina: 'https://www.britannica.com/animal/chicken',
};
export function rewardFact(words: string[], rng: () => number = Math.random): { word: string; fact: string } | null {
  const ws = words.filter(w => FACTS[w]);
  if (!ws.length) return null;
  const word = ws[Math.floor(rng() * ws.length)];
  return { word, fact: FACTS[word] };
}
