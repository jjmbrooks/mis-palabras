# Mazos nuevos: Animales, Cumpleaños y Navidad

Estado: en revisión (rama `feat/mazos-nuevos`), sin publicar.

## Palabras
- **Animales (15):** PERRO, GATO, VACA, PATO, LEÓN, OSO, PEZ, MONO, CERDO, BURRO, TORTUGA, JIRAFA, ELEFANTE, CABALLO, GALLINA.
- **Cumpleaños (9):** PASTEL, PIÑATA, GLOBO, VELA, REGALO, DULCES, GORRO, GELATINA, AMIGOS.
- **Navidad (11):** ÁRBOL, ESTRELLA, REGALO, PIÑATA, BOTA, ESFERA, CAMPANA, VELA, NIEVE, RENO, SANTA.

## Entradas compartidas
`src/deck.ts` tiene un registro único (`WORDS`), y cada mazo (`DECKS`) solo lista ids. REGALO, PIÑATA y VELA son **una sola entrada**
(`regalo`, `pinata`, `vela`) en Cumpleaños y Navidad. Comparten dibujo, historial y nivel, y el audio de palabra también,
porque la voz (`say`, es-MX) lee el mismo texto. NIEVE es una entrada única, solo en Navidad, dibujada como copo de nieve (ya no helado; revisión de Brooks).
**ÁRBOL de Navidad** es una entrada aparte (`arbol_navidad`): el pino adornado no es el árbol del mazo Abejas. Su audio sí es el mismo.
El mazo activo se elige en la pantalla de inicio y se guarda en `mp.deck` (solo en el dispositivo). La sesión guarda `deck`, y las reglas aceptan
`abejas-jardin`, `animales`, `cumpleanos` y `navidad`. **Hay que desplegar las reglas al publicar.**

## Arte
SVG original escrito por código en `scripts/gen_mazos.py` (se regenera con `python3 scripts/gen_mazos.py`), en el estilo de
[estilo-mazo-abejas.md](estilo-mazo-abejas.md): objeto kawaii con cara, degradados radiales, reflejo, sin contorno negro y sombra difusa.
Palabra en DejaVu Sans Bold mayúsculas. No hay personajes con derechos: SANTA es un diseño propio y genérico (señor kawaii de barba blanca y gorro rojo), sin parecido con ilustraciones de marcas (Coca-Cola, Disney, etc.). RENO es un reno genérico con nariz roja redonda. AMIGOS son dos niños genéricos.

## Animales: sonido y dato curioso (reforzador)
Tras un acierto con un animal suena la campanita y después el sonido del animal (`animalSound` en `src/audio.ts`). Al final del modo solo
aparece el dato curioso. **Fuente de todos los sonidos:** síntesis en el navegador con Web Audio. Es código original de este repositorio,
con licencia MIT, sin grabaciones ni archivos de terceros.

| Animal | Sonido sintetizado | Dato curioso | Fuente del dato |
|---|---|---|---|
| PERRO | guau guau (2 barridos de diente de sierra 520→300 Hz, filtro paso bajo) | El perro huele muchísimo mejor que las personas. | https://www.pbs.org/wgbh/nova/article/dogs-sense-of-smell (abierta y verificada, oct 2026) |
| GATO | miau (triángulo 560→820→480 Hz con vibrato) | Los bigotes del gato le ayudan a sentir lo que hay a su alrededor. | https://www.britannica.com/animal/cat (abierta y verificada, oct 2026) |
| VACA | muuu (diente de sierra 150→115 Hz, paso bajo) | La vaca tiene un estómago con cuatro partes para digerir el pasto. | https://www.britannica.com/animal/ruminant (abierta y verificada, oct 2026) |
| PATO | cuac ×3 (cuadrada 720→600 Hz) | El pato se arregla las plumas con un aceite que él mismo hace. | https://www.britannica.com/science/preen-gland (abierta y verificada, oct 2026) |
| LEON | rugido (diente de sierra 110→70 Hz + ruido filtrado) | El rugido del león se oye hasta a 8 kilómetros. | https://www.nationalgeographic.com/animals/mammals/facts/african-lion (abierta y verificada, oct 2026) |
| OSO | gruñido (diente de sierra 120→95 Hz, trémolo) | Muchos osos duermen casi todo el invierno en su cueva. | https://www.britannica.com/animal/bear (abierta y verificada, oct 2026) |
| PEZ | burbujas (4 blips senoidales ascendentes) | Los peces respiran bajo el agua con sus branquias. | https://www.nps.gov/articles/blue-in-the-face-breathing-underwater.htm (abierta y verificada, oct 2026) |
| MONO | uh-uh-ah (3 triángulos ascendentes) | Algunos monos usan la cola como una mano para agarrarse de las ramas. | https://www.britannica.com/animal/monkey (abierta y verificada, oct 2026) |
| CERDO | oinc oinc (cuadrada 260→180 Hz, trémolo) | El cerdo casi no suda; se revuelca en el lodo para refrescarse. | https://extension.missouri.edu/news/sweating-like-a-pig (abierta y verificada, oct 2026) |
| BURRO | ia-ia (alterna agudo/grave) | Las orejas largas del burro le ayudan a oír lejos y a quitarse el calor. | https://nationalzoo.si.edu/animals/miniature-donkey (abierta y verificada, oct 2026) |
| TORTUGA | resoplido suave (ruido filtrado; casi no vocalizan) | El caparazón de la tortuga es parte de sus huesos; no se lo puede quitar. | https://www.britannica.com/animal/turtle-reptile (abierta y verificada, oct 2026) |
| JIRAFA | zumbido grave (92 Hz senoidal) | La jirafa es el animal más alto de todos los que viven en tierra. | https://www.britannica.com/animal/giraffe (abierta y verificada, oct 2026) |
| ELEFANTE | barrito (diente de sierra 420→640 Hz) | El elefante usa la trompa para oler, beber agua y agarrar cosas. | https://www.britannica.com/animal/elephant-mammal (abierta y verificada, oct 2026) |
| CABALLO | relincho (diente de sierra 900→480 Hz, vibrato) | El caballo puede dormir de pie, sin caerse. | https://www.nationalgeographic.com/science/article/150711-animals-science-sleep-horses-bison-moose (abierta y verificada, oct 2026) |
| GALLINA | co-co-co-cooo (cuadrada) | El pollito sale del huevo después de unos 21 días. | https://www.britannica.com/animal/chicken (abierta y verificada, oct 2026) |

## Contraste de distractores en N1/N2
N1 muestra el dibujo y 2 opciones, y busca un distractor *muy distinto*: otra letra inicial y ≥2 letras de diferencia de longitud
(`isVeryDifferent`). N2 necesita dos así. La forma se revisó como letras en común (Jaccard <⅓). La prueba `tests/unit/mazos.test.ts` fija esta lista:

| Mazo | Sin ningún distractor muy distinto (N1) | Solo uno (N2 completa con otro) |
|---|---|---|
| Animales | — | — |
| Cumpleaños | GLOBO, GORRO | — |
| Navidad | — | — |
| Abejas (referencia) | MIEL, MAMÁ | FLOR, HOJA, AGUA, NUBE, RANA, CASA, PAPÁ |

FIESTA, TACOS y NIEVE salieron de Cumpleaños y SERPENTINA se probó y se quitó, así que GLOBO y GORRO dependen de la reserva de palabras ya vistas (abajo).

### Reserva de otros mazos (palabras ya vistas)
Si el mazo activo no tiene suficientes distractores muy distintos para N1/N2, `distractors(word, level, rng, pool, seen)` completa con
palabras **de otros mazos que el niño ya vio**, es decir, que tienen historial en su perfil (`seenWords(history)`, pasado a la sesión como
`SessionOptions.seen`). Nunca usa palabras sin historial, y nunca en N3+ (allí se buscan parecidos del mismo mazo). Si no hay vistas
suficientes, el motor cae como antes al siguiente nivel de contraste. Pruebas: MIEL y MAMÁ en Abejas toman un distractor muy distinto ya visto
(p. ej. ELEFANTE o TORTUGA); SOL no pide prestado porque su mazo ya alcanza.

## Orden de presentación: cortas primero
Cada palabra tiene su número de sílabas (`SYLLABLES` en `src/deck.ts`). Por defecto, las de **3 o más sílabas** quedan bloqueadas como
objetivo nuevo hasta que el niño domina (N4) **todas** las de 1–2 sílabas del mismo mazo (`lockedWord` en `src/engine.ts`). Una palabra larga
que ya tiene avance no se vuelve a bloquear. Se ajusta por palabra en `LENGTH_OVERRIDE` (`'corta'` la libera; `'larga'` la bloquea).
Por defecto todas las largas se quedan bloqueadas (confirmado por Brooks).

| Mazo | Cortas (1–2 sílabas) | Largas (3+), bloqueadas al inicio |
|---|---|---|
| Abejas | MIEL, FLOR, SOL, PANAL, HOJA, ÁRBOL, AGUA, NUBE, RANA, CASA, PAN, MAMÁ, PAPÁ | ABEJA (3), MARIPOSA (4) |
| Animales | PERRO, GATO, VACA, PATO, LEÓN, OSO, PEZ, MONO, CERDO, BURRO | TORTUGA (3), JIRAFA (3), ELEFANTE (4), CABALLO (3), GALLINA (3) |
| Cumpleaños | PASTEL, GLOBO, VELA, DULCES, GORRO | PIÑATA (3), REGALO (3), GELATINA (4), AMIGOS (3) |
| Navidad | ÁRBOL, BOTA, VELA, NIEVE, RENO, SANTA | ESTRELLA (3), REGALO (3), PIÑATA (3), ESFERA (3), CAMPANA (3) |

