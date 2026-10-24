# Mecánica inicial (MVP)

Especificación de la mecánica del producto mínimo viable de Mis Palabras. Cada decisión incluye un **Por qué** que remite a [evidencia.md](evidencia.md) (§2 = tabla de principios, §3 = limitaciones) o a [modos-de-uso.md](modos-de-uso.md) (D1–D11). Lo que no tiene respaldo directo se marca como *Inferencia de diseño*. No se añaden citas nuevas: solo se reutilizan las referencias verificadas de esos documentos.

> Este documento no contiene datos personales. Los ejemplos son genéricos.

## 1. Modo que se construye primero

| Decisión | Por qué |
|---|---|
| El MVP incluye solo el **Modo con tutor**. | La enseñanza con instigación sistemática y desvanecimiento guiada por un adulto es el núcleo con evidencia (Browder et al., 2006; Spector, 2011; Steinbrenner et al., 2020; evidencia §2). La tecnología se usa con supervisión (evidencia §2; D9). |
| El **Modo explorar** queda para la fase 2. | Explorar solo muestra palabras ya presentadas por el tutor (D4) y su diseño depende de los datos de dominio del modo tutor (D5). *Inferencia de diseño:* sin esos datos no hay qué mostrar en explorar. |

## 2. Tipos de carta (D12)

> **Decisión D12 (Diversa):** en el modo tutor el ensayo es **solo texto por defecto**. La imagen + texto se usa únicamente como **ayuda** o en la **fase de enseñanza**, nunca como la carta a la que el niño responde.

| Carta | Uso | Por qué |
|---|---|---|
| Imagen + texto | Solo **enseñanza** (presentación §3.1, que puede omitirse) y **ayuda** (§3.4). Nunca es el estímulo de un ensayo que cuente. | Con la imagen siempre visible el niño responde a la imagen y no al texto (Didden et al., 2000; ver §2.1). La imagen puede eclipsar la palabra si nunca se retira (Buckley y Bird, 1993; evidencia §3). |
| Solo imagen como estímulo (`imagen_estimulo`) | El niño ve el dibujo y **elige entre 2–3 palabras escritas**. Primer nivel. | Emparejar imagen con texto, con el texto como respuesta, enseñó mejor que presentar imagen y palabra juntas (Fossett y Mirenda, 2006; ver §2.1). Además comprueba el significado: reconocer no es comprender (El Zein et al., 2014; evidencia §3). |
| Solo texto, elegir (`elegir_texto`) | La app dice «Toca donde dice ABEJA» y el niño la **elige entre 2–3 palabras escritas** (D14). | Discriminación entre pocas opciones en ensayos discretos (Spector, 2011; evidencia §2). |
| Solo texto, leer (`leer`) | El niño **lee en voz alta** la palabra escrita, sola; el tutor marca «Leyó bien» o «Aún no». Último nivel. | Meta del desvanecimiento (Buckley y Bird, 1993; evidencia §2 y §3). |

### 2.1 Por qué solo texto por defecto (bloqueo por la imagen)

- **Didden, Prinsen y Sigafoos (2000)** compararon, con 6 alumnos con discapacidad intelectual moderada, palabras presentadas solas, con dibujo, y con el dibujo solo como retroalimentación. Cinco de seis aprendieron más rápido **con la palabra sola**; en las pruebas posteriores, 43 % de aciertos con dibujo, 47 % con dibujo como retroalimentación y 56 % con la palabra sola. Los autores lo explican como **bloqueo**: los alumnos ya nombraban los dibujos, así que con el dibujo presente respondían al dibujo y no a la palabra. De ahí vienen dos decisiones: la imagen solo aparece como ayuda o tras responder, y la palabra se repite sola después.
- **Fossett y Mirenda (2006)**, *Research in Developmental Disabilities, 27*(4), 411–429, con 2 niños con discapacidades del desarrollo: emparejar **imagen → texto** (el texto es la respuesta) fue más eficaz que presentar el dibujo y la palabra juntos (pares asociados). Por eso hay una carta solo imagen como estímulo, con palabras escritas como opciones.
- **Límites:** las muestras son muy pequeñas (6 y 2 participantes) y no son específicamente niños con síndrome de Down ni autismo. Es evidencia directa del mecanismo pero de alcance limitado; se suma a la cautela ya registrada en evidencia §3 (Buckley y Bird, 1993).

> **Nota de cita:** el encargo citó «Didden et al., 2006, *Research in Developmental Disabilities* 27(4)». Al verificarlo, ese número corresponde a **Fossett y Mirenda (2006)**; el estudio de Didden sobre el bloqueo es de **2000** (*Journal of Applied Behavior Analysis*). Aquí se citan los dos con sus datos reales.

## 3. Flujo de una carta, paso a paso

### 3.1 Presentación (enseñar)

> **Se omite** si el tutor marcó que el niño **ya conoce los dibujos** (ajuste por mazo y por niño; el del niño manda). Tampoco se muestra en la repetición tras una ayuda.

1. Se muestra la carta **imagen + texto**, grande y sola en pantalla.
2. Suena la palabra (voz natural y pausada). El tutor puede repetirla tocando la carta.
3. El tutor señala o pasa el dedo bajo las letras mientras se escucha.

**Por qué:** modelo de voz y apoyo visual son prácticas con evidencia (Steinbrenner et al., 2020; evidencia §2). El audio acompaña, no sustituye, a la palabra escrita (Buckley y Bird, 1993; D3).

### 3.2 Ensayo (preguntar o leer)

1. **La app lee en voz alta la instrucción** del ensayo (D14, §3.6), en el modo tutor y en el modo solo. Hay un botón grande 🔊 para repetirla. El estímulo es el dibujo solo (`imagen_estimulo`), la palabra hablada (`elegir_texto`) o la palabra escrita sola (`leer`).
2. Aparecen las opciones: **2 al inicio, 3 después** (cuando la palabra supera el 80 % de aciertos en una sesión; *inferencia de diseño* para el umbral).
3. La posición de las opciones se **mezcla en cada intento**.
4. Las opciones se habilitan tras una **breve demora** (≈1 s) para evitar toques impulsivos.
5. Las opciones son **solo palabras escritas**, sin dibujo. En `leer` e `imagen_estimulo` **la palabra meta no suena antes de responder**; suena **después**, como confirmación. En `elegir_texto` la palabra hablada es el estímulo (§3.6).

**Por qué:**
- Discriminación entre 2–4 opciones en ensayos discretos (Spector, 2011; Steinbrenner et al., 2020; evidencia §2). Los distractores parecidos se introducen después (Buckley y Bird, 1993).
- Posición aleatoria: *inferencia de diseño* ya señalada en evidencia §2, para evitar aciertos por lugar.
- Demora antes de habilitar: *inferencia de diseño* (evitar el tocar al azar).
- La palabra solo suena después de responder en `leer` e `imagen_estimulo`: si sonara antes, daría la respuesta (D3, D12, D14). El dibujo como retroalimentación tras responder funcionó en algunos alumnos (Didden et al., 2000).

### 3.3 Acierto

- Refuerzo **inmediato y breve** (< 2 s): elogio de voz («¡MIEL, muy bien!»), sonido suave y +1 en el contador de monedas.
- Sin animaciones largas ni ajenas a la tarea. Las monedas se canjean por un premio real que decide el tutor, fuera de la app.

**Por qué:** refuerzo positivo diferencial y economía de fichas (Spector, 2011; Steinbrenner et al., 2020; Fuller y Fienup, 2018; evidencia §2). El premio no debe competir con el texto (Buckley y Bird, 1993).

### 3.4 Error o duda: ayuda graduada sin error

Se activa con el **botón «Ayuda»**, si no hay respuesta en **≈5 s** (configurable 3–5 s, 5 por defecto) o tras un error. **Un error no produce sonido negativo**; simplemente se inicia la ayuda.

Jerarquía de ayuda (D12):

| Nivel | Ayuda |
|---|---|
| B | Aparece la carta **imagen + texto** de la palabra, como ayuda para comparar. |
| C | Si vuelve a fallar: el tutor guía directamente y solo queda habilitada la opción correcta. |

(El nivel A anterior, resaltar la opción correcta, se retira: daba la respuesta sin pasar por el texto. Queda solo para leer historiales antiguos.)

Después de una respuesta con ayuda, **se repite la palabra sola**, sin imagen ni ayuda inicial, y luego se intercala una **palabra ya conocida** para terminar en acierto. **Solo esa repetición sin ayuda cuenta como acierto independiente**: el ensayo con ayuda se registra como no independiente.

**Por qué (D12):** si la imagen estuviera siempre visible, el acierto no demostraría lectura (Didden et al., 2000; §2.1).

**Por qué:** aprendizaje sin error y demora de tiempo (Mueller et al., 2007; Browder et al., 2009; evidencia §2). Estos niños tienen dificultad para corregir respuestas erróneas y son sensibles al fracaso (Buckley y Bird, 1993). El emparejamiento palabra-palabra es el paso intermedio de la secuencia emparejar → seleccionar → nombrar (Buckley y Bird, 1993). Corrección con modelo (Fuller y Fienup, 2018). *Inferencia de diseño:* intercalar una palabra conocida y el umbral de 3–5 s.

### 3.5 Variante «ya conoce los dibujos» (D12.5)

Ajuste del tutor **por mazo** («Abejas y jardín: ya conoce los dibujos») y **por niño** (como el mazo / ya conoce / enseñar con imagen + texto). Si está activo, se salta la fase de enseñanza imagen + texto (§3.1) y se empieza directamente con ensayos de solo texto. Se guarda solo en el dispositivo, sin datos nuevos en la nube.

**Por qué:** la imagen puede eclipsar la palabra (Buckley y Bird, 1993; evidencia §3); empezar con palabras que el niño ya comprende (Buckley y Bird, 1993; evidencia §2). *Inferencia de diseño:* ofrecerla como opción para comparar qué funciona mejor con cada niño, con los datos de registro.

### 3.6 Instrucción hablada (D14)

| Tipo de ensayo | Se dice en voz alta | Texto visible | ¿Nombra la palabra meta? |
|---|---|---|---|
| `leer` | «¿Qué dice aquí?» | «¿Qué dice aquí?» | **No** |
| `imagen_estimulo` (dibujo → palabra) | «Toca la palabra de este dibujo.» | igual | **No** |
| `elegir_texto` | «Toca donde dice ABEJA» | «Toca donde dice…» | **Sí, solo hablada** |

- Se lee al empezar cada ensayo, en el modo tutor y en el modo solo. Un **botón grande 🔊** la repite. Las opciones se habilitan cuando termina la instrucción, con la demora mínima de ≈1 s.
- La voz es la que ya usa la app (`speechSynthesis` con una voz es-MX si existe; si no, Web Speech en `es-MX`), con el mismo volumen limitado.
- El único texto visible es la frase corta. Desaparecen «Escucha al tutor» y el botón de «mantén presionado».

**Por qué.**
- **`leer` e `imagen_estimulo` no nombran la palabra.** Es el mismo principio de D12, el **bloqueo de estímulo**. Si la instrucción dijera la palabra, el niño podría responder al sonido o al dibujo ya conocido y no al texto, y el acierto no demostraría lectura (Didden et al., 2000; Fossett y Mirenda, 2006; §2.1). Por eso la instrucción es neutra, y la palabra suena solo después de responder, como confirmación (D3).
- **`elegir_texto` sí nombra la palabra.** Ahí la tarea es justo **emparejar la palabra hablada con la escrita**, la base de la enseñanza sistemática de palabras a la vista (Browder et al., 2009; Spector, 2011; evidencia §2). El sonido es el estímulo y el texto la respuesta, así que no compite con el texto. Por eso el texto visible no la repite («Toca donde dice…»): si apareciera escrita, el niño podría emparejar letras con letras sin escuchar.
- **Instrucción hablada y botón para repetirla:** el niño no necesita leer la consigna, y en el modo solo no hay adulto que la diga. *Inferencia de diseño.*
- **Prueba automática:** `tests/unit` comprueba que en `leer` e `imagen_estimulo` ninguna instrucción, ni hablada ni visible, contiene la palabra meta para todo el mazo, y que en `elegir_texto` la palabra solo va en la frase hablada.

## 4. Sesión

| Decisión | Por qué |
|---|---|
| Duración de 5–10 min y 10–15 ensayos. | Ensayos agrupados con apoyo (Spector, 2011); la duración exacta es recomendación prudente (evidencia §2 y §3). |
| De 2 a 4 palabras objetivo, mezcladas con palabras conocidas. | *Inferencia de diseño:* mantener una tasa alta de aciertos, coherente con aprendizaje sin error (Mueller et al., 2007). |
| La sesión termina en acierto. | *Inferencia de diseño* coherente con la sensibilidad al fracaso (Buckley y Bird, 1993). |
| El tutor puede terminar en cualquier momento; hay aviso de cierre. | Límite de tiempo y aviso de cierre (D9); tiempo de pantalla breve y acompañado (AAP, 2016; evidencia §3). |

## 5. Dominio y retiro de ayudas

| Decisión | Por qué |
|---|---|
| Una palabra se domina con **≥ 90 % de aciertos al primer intento, sin ayuda, en 2 sesiones seguidas**. | Mejor retención con criterio de 90 % (Fuller y Fienup, 2018; evidencia §2). Las sesiones consecutivas son práctica común poco estudiada. |
| Orden de niveles (D12): **dibujo → elegir palabra escrita** (`imagen_estimulo`) → **elegir palabra dicha por el tutor** (`elegir_texto`) → **leer la palabra sola** (`leer`). La imagen + texto ya no es un nivel, solo ayuda. | Retiro de apoyos de evidencia §2 (Browder et al., 2006; Spector, 2011; Buckley y Bird, 1993), ajustado por el bloqueo de la imagen (Didden et al., 2000; Fossett y Mirenda, 2006). Historiales anteriores se leen por equivalencia (imagen_texto → 1.º, emparejar → 2.º, solo_texto → 3.º). |
| Se pasa al nivel siguiente al cumplir el criterio en el nivel actual. | *Inferencia de diseño* basada en el criterio anterior. |
| Si una palabra queda **por debajo de ≈60 % en 2 sesiones seguidas**, baja un nivel de apoyo. | *Inferencia de diseño:* volver a condiciones de pocos errores (Mueller et al., 2007). |
| Las palabras dominadas pasan a **repaso espaciado** (p. ej., a los 2, 7 y 21 días). | Mantenimiento medido de forma espaciada (Fuller y Fienup, 2018; evidencia §2). Intervalos concretos: *inferencia de diseño*. |
| Comprobación final con **tarjetas físicas** y el tutor, que la registra en la app. | Generalización fuera de la app (Spector, 2011; Buckley y Bird, 1993; evidencia §2). |

## 6. Primer mazo: «Abejas y jardín»

Personajes y dibujos **originales y genéricos**; no se usan personajes con derechos de autor (D11).

| # | Palabra | # | Palabra | # | Palabra |
|---|---|---|---|---|---|
| 1 | ABEJA | 6 | HOJA | 11 | MARIPOSA |
| 2 | MIEL | 7 | ÁRBOL | 12 | CASA |
| 3 | FLOR | 8 | AGUA | 13 | PAN |
| 4 | SOL | 9 | NUBE | 14 | MAMÁ |
| 5 | PANAL | 10 | RANA | 15 | PAPÁ |

Criterios: concretas, dibujables, mayoría de 4–5 letras y visualmente distintas entre sí. Evitar al inicio pares de forma parecida (p. ej., PAN/PANAL, MAMÁ/PAPÁ) en el mismo ensayo.

- **Empezar por las palabras que el niño ya dice o entiende.** Por qué: Buckley y Bird (1993) empiezan con palabras que el niño ya comprende (evidencia §2).
- **El tutor puede añadir palabras propias** (nombres de familia, mascotas, intereses) de forma privada en su cuenta. Por qué: palabras con significado e intereses del niño (Gunn y Delafield-Butt, 2016; Koegel et al., 1987; evidencia §2; D7). Los datos permanecen solo en la cuenta de la familia (requisitos de privacidad del README).
- Pares parecidos después. Por qué: confusiones entre palabras de forma parecida (Buckley y Bird, 1993; evidencia §2).

## 7. Consideraciones sensoriales

| Decisión | Por qué |
|---|---|
| Volumen máximo limitado y ajustable; voz natural y pausada. | Diseño sensorial tranquilo con control de volumen (evidencia §2; D10). |
| Sin sonidos repentinos ni parpadeos; paleta suave. | Ídem; *principio de prudencia con evidencia indirecta* (evidencia §2 y §3). |
| Una sola carta en foco; pocos elementos en pantalla. | Las imágenes y elementos extra distraen de la palabra (Buckley y Bird, 1993). |
| Animaciones < 1 s y opcionales; ajuste «reducir movimiento» (respeta la preferencia del sistema). | *Inferencia de diseño* dentro del principio de prudencia sensorial (D10). |
| Sin anuncios ni compras dentro de la app. | D10. |
| Señal de cierre amable al terminar la sesión. | D9. |

## 8. Datos por ensayo

Se registra solo lo necesario para decidir dominio y ayudas:

| Campo | Ejemplo |
|---|---|
| palabra | MIEL |
| tipo de carta | imagen_estimulo / elegir_texto / leer |
| nivel de ayuda | ninguna / B / C |
| acierto al primer intento | sí / no |
| latencia (ms) | 2300 |
| fecha y hora | 2026-01-15T10:30 |

**Por qué:** las decisiones se toman con datos ensayo por ensayo (Fuller y Fienup, 2018; evidencia §2). **Principio de datos mínimos:** sin nombre real, fotos ni audio del niño; datos solo en la cuenta de la familia, exportables y borrables (requisitos de privacidad del README; D5). *Inferencia de diseño:* la latencia ayuda a ajustar la demora de ayuda.

## Referencias

Añadidas por D12 (también en [evidencia.md §4](evidencia.md#4-referencias-apa-7)):

- Didden, R., Prinsen, H., y Sigafoos, J. (2000). The blocking effect of pictorial prompts on sight-word reading. *Journal of Applied Behavior Analysis, 33*(3), 317–320. https://doi.org/10.1901/jaba.2000.33-317
- Fossett, B., y Mirenda, P. (2006). Sight word reading in children with developmental disabilities: A comparison of paired associate and picture-to-text matching instruction. *Research in Developmental Disabilities, 27*(4), 411–429. https://doi.org/10.1016/j.ridd.2005.05.006

Todas las referencias completas (APA 7) están en [evidencia.md §4](evidencia.md#4-referencias-apa-7) y en [modos-de-uso.md](modos-de-uso.md#referencias). Las citas pendientes de verificación tienen issue abierto en el repositorio.
