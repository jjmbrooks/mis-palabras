# Estilo artístico — mazo «Abejas y jardín»

Guía para que las 12 palabras restantes se vean igual que ABEJA, MIEL y FLOR (tarjetas impresas originales).

## Origen y derechos
- **SVG vectorial original escrito por código; sin IA generativa ni referencias externas.**
- ABEJA, MIEL y FLOR: escritos por Diversa (15-oct-2026). Las otras 12 palabras: escritas por Codelius (oct-2026) con la misma paleta, gradientes y estructura (viewBox 200×200).
- Se publican bajo la licencia MIT del repositorio. **No se usa ningún personaje con derechos de autor** (la tarjeta BARRY del material impreso se excluyó por completo).

## Archivos
Los 15 SVG del mazo están en [`src/art/`](../src/art/) (`abeja.svg`, `miel.svg`, `flor.svg` de Diversa; el resto de Codelius), viewBox 200×200, sin imágenes incrustadas ni enlaces externos.

## Estilo del dibujo
- **Objeto kawaii con cara**: cada objeto tiene ojos grandes redondos (iris café oscuro #48321b, brillo blanco, contorno café fino), sonrisa curva café sencilla y dos mejillas rosadas difusas (#f4a0a0 aprox.).
- **Volumen tipo vector con degradados suaves** (estilo emoji 3D / clip-art brillante): degradado radial, reflejo blanco semitransparente arriba a la izquierda, sin texturas.
- **Sin contorno negro grueso**; bordes definidos por el color. Solo los ojos llevan línea fina.
- **Sombra**: elipse gris muy suave y difusa bajo el objeto (gris claro, ~#e6e6e6 → transparente).
- **Fondo**: blanco puro #ffffff, sin escenario. Un objeto centrado, vista frontal, proporciones redondeadas y achaparradas.

## Paleta (muestreada)
| Uso | Hex |
|---|---|
| Amarillo claro (luz) | #ffd245 / #ffc533 |
| Amarillo/ámbar medio | #f3ae1a / #f4af29 |
| Ámbar sombra | #e39b0b / #c77d0a |
| Café oscuro (rayas, ojos) | #48321b |
| Café tapa/miel oscura | #955614 / #dc8d28 |
| Azul alas (translúcido) | #e2f2fb / #f6fbfe, borde #9cc8e6 aprox. |
| Rosa pétalos | #ffb7ce / #ffa5c2 |
| Verde hojas | #5cbf4f aprox. / tallo #3e9a3a aprox. |
| Fondo | #ffffff |

## Diseño de la tarjeta
- Tarjeta vertical ~3.8 × 4.8 in (≈ 4:5), fondo blanco, línea de corte punteada gris en impresión.
- **Imagen + palabra**: dibujo centrado en la mitad superior (~45 % de la altura), palabra debajo, centrada.
- **Solo imagen**: dibujo centrado, ~55 % de la altura.
- **Solo palabra**: palabra centrada vertical y horizontalmente.
- Margen interno ≥ 10 % por lado.

## Tipografía de la palabra
- **DejaVu Sans Bold** (sans-serif geométrica/humanista, alternativas: Verdana Bold, Arial Rounded).
- **MAYÚSCULAS**, negro #000000, interletraje amplio (~+5 %).
- Altura de mayúscula ≈ 12 % de la altura de la tarjeta (~42 pt en la tarjeta impresa); la palabra ocupa ~70–80 % del ancho (MARIPOSA: reducir para que quepa, igual en todas las tarjetas del mazo si es posible).
- Conservar acentos: ÁRBOL, MAMÁ, PAPÁ.

## Plantilla de prompt (inglés)
```
Cute kawaii {OBJECT} character, single object centered, front view, rounded chubby proportions,
big round dark-brown eyes with white highlights and thin brown outline, small simple curved brown smile,
soft pink blush cheeks, glossy vector illustration with smooth radial gradients and a soft white highlight
on the top-left, no black outlines, soft blurred light-grey oval shadow underneath, pure white background,
palette: warm yellows (#ffd245, #f3ae1a), dark brown (#48321b), {EXTRA COLORS}, children's flashcard style,
calm and friendly, no text, no letters, no logos, no scenery, no copyrighted characters, square 1:1.
```

## Prompts por palabra
| Palabra | {OBJECT} | {EXTRA COLORS} |
|---|---|---|
| SOL | sun with short rounded rays | golden yellow, orange #f4af29 |
| PANAL | honeycomb chunk with hexagon cells dripping honey | amber #e79712, honey #ffc533 |
| HOJA | single green leaf with central vein | leaf green #5cbf4f, dark green #3e9a3a |
| ÁRBOL | small round-canopy tree with brown trunk | green #5cbf4f, brown #955614 |
| AGUA | water drop | light blue #8fd0f5, blue #3d9be0 |
| NUBE | fluffy white cloud | white, pale blue #e2f2fb |
| RANA | sitting green frog | green #5cbf4f, light green #b6d58f |
| MARIPOSA | butterfly with rounded wings | pink #ffb7ce, lilac #c9a7f0, yellow body |
| CASA | small house with red roof and door | red roof #e25b4a, cream walls #fff1d0 |
| PAN | bread loaf (bolillo) | golden crust #e39b0b, cream #f3e0b6 |
| MAMÁ | friendly cartoon woman, generic, simple, waving | neutral skin tones, any; generic, not a real person |
| PAPÁ | friendly cartoon man, generic, simple, waving | neutral skin tones; generic, not a real person |

Notas: MAMÁ y PAPÁ son personas genéricas (no retratos); evaluar si conviene que cada familia suba su propia foto en la app (privacidad: solo local/cuenta). Revisar a mano que ninguna imagen generada incluya texto.
