# Mecánica inicial (MVP)

Especificación de la mecánica del producto mínimo viable de Mis Palabras. Cada decisión incluye un **Por qué** que remite a [evidencia.md](evidencia.md) (§2 = tabla de principios, §3 = limitaciones) o a [modos-de-uso.md](modos-de-uso.md) (D1–D11). Lo que no tiene respaldo directo se marca como *Inferencia de diseño*. No se añaden citas nuevas: solo se reutilizan las referencias verificadas de esos documentos.

> Este documento no contiene datos personales. Los ejemplos son genéricos.

## 1. Modo que se construye primero

| Decisión | Por qué |
|---|---|
| El MVP incluye solo el **Modo con tutor**. | La enseñanza con instigación sistemática y desvanecimiento guiada por un adulto es el núcleo con evidencia (Browder et al., 2006; Spector, 2011; Steinbrenner et al., 2020; evidencia §2). La tecnología se usa con supervisión (evidencia §2; D9). |
| El **Modo explorar** queda para la fase 2. | Explorar solo muestra palabras ya presentadas por el tutor (D4) y su diseño depende de los datos de dominio del modo tutor (D5). *Inferencia de diseño:* sin esos datos no hay qué mostrar en explorar. |

## 2. Tipos de carta

| Carta | Uso | Por qué |
|---|---|---|
| Imagen + texto | Enseñar (presentación y modelo de ayuda) | Punto de partida con apoyo visual (Spector, 2011; evidencia §2; D2). |
| Solo imagen | Preguntar o comprobar comprensión (palabra → imagen) | Reconocer no es comprender; hay que comprobar el significado (El Zein et al., 2014; evidencia §3; D2). |
| Solo texto | Leer: la palabra sin imagen | Meta del desvanecimiento; la imagen puede eclipsar la palabra si nunca se retira (Buckley y Bird, 1993; evidencia §3). |

## 3. Flujo de una carta, paso a paso

### 3.1 Presentación (enseñar)

1. Se muestra la carta **imagen + texto**, grande y sola en pantalla.
2. Suena la palabra (voz natural y pausada). El tutor puede repetirla tocando la carta.
3. El tutor señala o pasa el dedo bajo las letras mientras se escucha.

**Por qué:** modelo de voz y apoyo visual son prácticas con evidencia (Steinbrenner et al., 2020; evidencia §2). El audio acompaña, no sustituye, a la palabra escrita (Buckley y Bird, 1993; D3).

### 3.2 Ensayo (preguntar o leer)

1. La voz da la instrucción: «Toca MIEL».
2. Aparecen las opciones: **2 al inicio, 3 después** (cuando la palabra supera el 80 % de aciertos en una sesión; *inferencia de diseño* para el umbral).
3. La posición de las opciones se **mezcla en cada intento**.
4. Las opciones se habilitan tras una **breve demora** (≈1 s) para evitar toques impulsivos.
5. Las cartas de opción **no suenan antes de elegir**; la palabra suena **después** de la selección como confirmación.

**Por qué:**
- Discriminación entre 2–4 opciones en ensayos discretos (Spector, 2011; Steinbrenner et al., 2020; evidencia §2). Los distractores parecidos se introducen después (Buckley y Bird, 1993).
- Posición aleatoria: *inferencia de diseño* ya señalada en evidencia §2, para evitar aciertos por lugar.
- Demora antes de habilitar: *inferencia de diseño* (evitar el tocar al azar).
- Audio solo tras elegir: si la opción sonara antes, daría la respuesta (D3).

### 3.3 Acierto

- Refuerzo **inmediato y breve** (< 2 s): elogio de voz («¡MIEL, muy bien!»), sonido suave y +1 en el contador de monedas.
- Sin animaciones largas ni ajenas a la tarea. Las monedas se canjean por un premio real que decide el tutor, fuera de la app.

**Por qué:** refuerzo positivo diferencial y economía de fichas (Spector, 2011; Steinbrenner et al., 2020; Fuller y Fienup, 2018; evidencia §2). El premio no debe competir con el texto (Buckley y Bird, 1993).

### 3.4 Error o duda: ayuda graduada sin error

Se activa si no hay respuesta en **3–5 s** (configurable) o si toca una opción incorrecta. **Un toque incorrecto no produce sonido negativo**; simplemente se inicia la ayuda.

Jerarquía de ayuda (de menor a mayor):

| Nivel | Ayuda |
|---|---|
| A | Se resalta o pulsa suavemente la opción correcta. |
| B | Aparece la carta modelo **imagen + texto** para comparar letra por letra (emparejar con la muestra). |
| C | El tutor guía directamente (señala, acerca la carta, guía la mano). |

Después de la respuesta con ayuda, **se repite el ensayo** y luego se intercala una **palabra ya conocida** para terminar en acierto.

**Por qué:** aprendizaje sin error y demora de tiempo (Mueller et al., 2007; Browder et al., 2009; evidencia §2). Estos niños tienen dificultad para corregir respuestas erróneas y son sensibles al fracaso (Buckley y Bird, 1993). El emparejamiento palabra-palabra es el paso intermedio de la secuencia emparejar → seleccionar → nombrar (Buckley y Bird, 1993). Corrección con modelo (Fuller y Fienup, 2018). *Inferencia de diseño:* intercalar una palabra conocida y el umbral de 3–5 s.

### 3.5 Variante «sin imagen desde el inicio»

Opción por niño y por palabra: la palabra se presenta solo como texto + audio, sin dibujo, apoyándose en que el niño ya dice o entiende la palabra.

**Por qué:** la imagen puede eclipsar la palabra (Buckley y Bird, 1993; evidencia §3); empezar con palabras que el niño ya comprende (Buckley y Bird, 1993; evidencia §2). *Inferencia de diseño:* ofrecerla como opción para comparar qué funciona mejor con cada niño, con los datos de registro.

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
| Orden de retiro: **imagen + texto → emparejar letras → solo texto**. | Secuencia de evidencia §2 (Browder et al., 2006; Spector, 2011; Buckley y Bird, 1993). |
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
| tipo de carta | solo_texto |
| nivel de ayuda | ninguna / A / B / C |
| acierto al primer intento | sí / no |
| latencia (ms) | 2300 |
| fecha y hora | 2026-01-15T10:30 |

**Por qué:** las decisiones se toman con datos ensayo por ensayo (Fuller y Fienup, 2018; evidencia §2). **Principio de datos mínimos:** sin nombre real, fotos ni audio del niño; datos solo en la cuenta de la familia, exportables y borrables (requisitos de privacidad del README; D5). *Inferencia de diseño:* la latencia ayuda a ajustar la demora de ayuda.

## Referencias

Todas las referencias completas (APA 7) están en [evidencia.md §4](evidencia.md#4-referencias-apa-7) y en [modos-de-uso.md](modos-de-uso.md#referencias). Las citas pendientes de verificación tienen issue abierto en el repositorio.
