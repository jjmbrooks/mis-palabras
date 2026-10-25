# Mazos nuevos: Animales, Cumpleaños y Navidad

Estado: en revisión (rama `feat/mazos-nuevos`), sin publicar.

## Palabras
- **Animales (15):** PERRO, GATO, VACA, PATO, LEÓN, OSO, PEZ, MONO, CERDO, BURRO, TORTUGA, JIRAFA, ELEFANTE, CABALLO, GALLINA.
- **Cumpleaños (12):** PASTEL, PIÑATA, GLOBO, VELA, REGALO, DULCES, GORRO, FIESTA, TACOS, GELATINA, NIEVE, AMIGOS.
- **Navidad (12):** ÁRBOL, ESTRELLA, REGALO, NIEVE, PIÑATA, BOTA, PONCHE, BUÑUELO, NACIMIENTO, ESFERA, CAMPANA, VELA.

## Entradas compartidas
`src/deck.ts` tiene un registro único (`WORDS`), y cada mazo (`DECKS`) solo lista ids. REGALO, NIEVE, PIÑATA y VELA son **una sola entrada**
(`regalo`, `nieve`, `pinata`, `vela`) en Cumpleaños y Navidad. Comparten dibujo, historial y nivel, y el audio de palabra también,
porque la voz (`say`, es-MX) lee el mismo texto. NIEVE es la nieve de garrafa (helado), que sirve en los dos mazos.
**ÁRBOL de Navidad** es una entrada aparte (`arbol_navidad`): el pino adornado no es el árbol del mazo Abejas. Su audio sí es el mismo.
El mazo activo se elige en la pantalla de inicio y se guarda en `mp.deck` (solo en el dispositivo). La sesión guarda `deck`, y las reglas aceptan
`abejas-jardin`, `animales`, `cumpleanos` y `navidad`. **Hay que desplegar las reglas al publicar.**

## Arte
SVG original escrito por código en `scripts/gen_mazos.py` (se regenera con `python3 scripts/gen_mazos.py`), en el estilo de
[estilo-mazo-abejas.md](estilo-mazo-abejas.md): objeto kawaii con cara, degradados radiales, reflejo, sin contorno negro y sombra difusa.
Palabra en DejaVu Sans Bold mayúsculas. No hay personajes con derechos (ni Santa Claus ni Disney). AMIGOS son dos niños genéricos.

## Animales: sonido y dato curioso (reforzador)
Tras un acierto con un animal suena la campanita y después el sonido del animal (`animalSound` en `src/audio.ts`). Al final del modo solo
aparece el dato curioso. **Fuente de todos los sonidos:** síntesis en el navegador con Web Audio. Es código original de este repositorio,
con licencia MIT, sin grabaciones ni archivos de terceros.

| Animal | Sonido sintetizado | Dato curioso | Fuente del dato |
|---|---|---|---|
| PERRO | guau guau (2 barridos de diente de sierra 520→300 Hz, filtro paso bajo) | https://www.britannica.com/animal/dog | https://www.britannica.com/animal/dog |
| GATO | miau (triángulo 560→820→480 Hz con vibrato) | https://www.britannica.com/animal/cat | https://www.britannica.com/animal/cat |
| VACA | muuu (diente de sierra 150→115 Hz, paso bajo) | https://www.britannica.com/animal/ruminant | https://www.britannica.com/animal/ruminant |
| PATO | cuac ×3 (cuadrada 720→600 Hz) | https://www.britannica.com/science/preen-gland | https://www.britannica.com/science/preen-gland |
| LEON | rugido (diente de sierra 110→70 Hz + ruido filtrado) | https://nationalzoo.si.edu/animals/african-lion | https://nationalzoo.si.edu/animals/african-lion |
| OSO | gruñido (diente de sierra 120→95 Hz, trémolo) | https://www.britannica.com/animal/bear | https://www.britannica.com/animal/bear |
| PEZ | burbujas (4 blips senoidales ascendentes) | https://www.britannica.com/science/gill | https://www.britannica.com/science/gill |
| MONO | uh-uh-ah (3 triángulos ascendentes) | https://www.britannica.com/animal/monkey | https://www.britannica.com/animal/monkey |
| CERDO | oinc oinc (cuadrada 260→180 Hz, trémolo) | https://www.britannica.com/animal/pig | https://www.britannica.com/animal/pig |
| BURRO | ia-ia (alterna agudo/grave) | https://nationalzoo.si.edu/animals/miniature-donkey | https://nationalzoo.si.edu/animals/miniature-donkey |
| TORTUGA | resoplido suave (ruido filtrado; casi no vocalizan) | https://www.britannica.com/animal/turtle-reptile | https://www.britannica.com/animal/turtle-reptile |
| JIRAFA | zumbido grave (92 Hz senoidal) | https://www.britannica.com/animal/giraffe | https://www.britannica.com/animal/giraffe |
| ELEFANTE | barrito (diente de sierra 420→640 Hz) | https://www.britannica.com/animal/elephant-mammal | https://www.britannica.com/animal/elephant-mammal |
| CABALLO | relincho (diente de sierra 900→480 Hz, vibrato) | https://www.nationalgeographic.com/science/article/150711-animals-science-sleep-horses-bison-moose | https://www.nationalgeographic.com/science/article/150711-animals-science-sleep-horses-bison-moose |
| GALLINA | co-co-co-cooo (cuadrada) | https://www.britannica.com/animal/chicken | https://www.britannica.com/animal/chicken |

## Contraste de distractores en N1/N2
N1 muestra el dibujo y 2 opciones, y busca un distractor *muy distinto*: otra letra inicial y ≥2 letras de diferencia de longitud
(`isVeryDifferent`). N2 necesita dos así. La forma se revisó como letras en común (Jaccard <⅓). La prueba `tests/unit/mazos.test.ts` fija esta lista:

| Mazo | Sin ningún distractor muy distinto (N1) | Solo uno (N2 completa con otro) |
|---|---|---|
| Animales | — | — |
| Cumpleaños | GLOBO, GORRO | TACOS, NIEVE |
| Navidad | — | — |
| Abejas (referencia) | MIEL, MAMÁ | FLOR, HOJA, AGUA, NUBE, RANA, CASA, PAPÁ |

En Cumpleaños casi todas las palabras tienen 5–6 letras, y la única larga (GELATINA) empieza con G. Para GLOBO y GORRO no hay nada con otra inicial y ±2
letras. Además, GLOBO/GORRO se marcaron como par parecido (`SIMILAR`). Hoy el motor cae al siguiente nivel de contraste. Para cerrar los huecos,
una palabra larga sin G inicial (p. ej. MAÑANITAS o SERPENTINA) o una de ≤3 letras. No se agregó: queda a decisión de Brooks.
