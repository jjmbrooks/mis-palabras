# Arquitectura (MVP: Modo con tutor)

## Pila
- **Vite + TypeScript**, sin framework. PWA *mobile-first* (`public/manifest.webmanifest`, `public/sw.js`).
- **Firebase web SDK**: solo `firebase/app`, `firebase/auth` y `firebase/firestore`. **No se incluye Analytics.**
- **Hospedaje:** GitHub Pages, publicado por GitHub Actions (`.github/workflows/pages.yml`) en cada push a `main`.
- **CI:** `.github/workflows/ci.yml` — pruebas unitarias, pruebas de reglas con el emulador de Firestore y build.

## Módulos (`src/`)
| Archivo | Qué hace |
|---|---|
| `engine.ts` | Lógica pura de la sesión: opciones (2 → 3), posiciones al azar, repetición tras ayuda, palabra conocida intercalada, cierre en acierto, 12–15 ensayos, criterio de dominio y retiro de ayudas, CSV. Probado en `tests/unit`. |
| `deck.ts` | Mazo «Abejas y jardín» (15 palabras) e ilustraciones. |
| `audio.ts` | Voz con `speechSynthesis` y refuerzo con WebAudio. |
| `store.ts` | Datos: Firebase (cuenta = familia) o modo de prueba en memoria. |
| `config.ts` | Configuración **pública** del cliente de Firebase. |
| `main.ts` | Pantallas: inicio/login, elegir niño (apodo), sesión, cierre, panel del tutor. |

## Cómo se implementa `docs/mecanica-inicial.md`
- **Presentación** (§3.1): desde D15 no hay carta imagen + texto previa; el dibujo acompaña cada ensayo de elegir y la carta imagen + texto queda como Ayuda.
- **Ensayo** (§3.2, D12): solo texto por defecto y instrucción hablada con botón 🔊 para repetirla (D14, `instructionFor`): neutra en `leer` y «Toca donde dice ABEJA» en `elegir_texto`. Tipos (D15): `elegir_texto` (dibujo visible, la app dice la palabra y el niño la elige entre 2–3 palabras escritas) y `leer` (palabra sola; el tutor marca «Leyó bien» / «Aún no»). 2 opciones, 3 cuando la palabra supera el 80 % en la sesión; posiciones mezcladas; controles habilitados ≥ 1 s después de iniciar; tras responder suena la palabra.
- **Acierto** (§3.3): resalta la carta, sonido suave (< 1 s), «¡MIEL, muy bien!» y +1 moneda.
- **Error o duda** (§3.4, D12): sin sonido negativo. Botón «Ayuda», ≈5 s sin respuesta (configurable 3–5) o un error muestran la carta imagen + texto (**B**); otro error pide guía del tutor y deja activa solo la correcta (**C**). Después se repite la palabra sola; solo esa repetición sin ayuda cuenta como acierto independiente (`isIndependent`).
- **Sesión** (§4): 2–4 palabras objetivo (se evitan PAN/PANAL y MAMÁ/PAPÁ juntas), 12 ensayos (máx. 15), termina en acierto; límite 5–10 min (8 por defecto) con barra que se vacía y aviso «Ya casi terminamos»; botón Terminar.
- **Niveles y dominio** (§5, D16): `wordStates` reproduce el historial por palabra. N1 dibujo + 2 opciones muy distintas → N2 3 opciones → N3 distractores parecidos (`distractors`) → N4 sin dibujo (dominada) → N5 leer en voz alta con tutor. Sube con ≥ 90 % al primer intento en 2 sesiones seguidas y baja tras 2 fallos seguidos (también dentro de la sesión, `Session.record`). Cada ensayo guarda `level`; los historiales sin nivel se migran al leerlos (elegir → N1, leer → N4, leer superado → N5). Pendiente: repaso espaciado, tarjetas físicas, palabras propias.
- **Registro y modo independiente** (D13, modos-de-uso.md): cada sesión guarda inicio, fin, duración, modo y mazo (`sessions`), y cada ensayo, `mode` y `helps`. El panel del tutor muestra las sesiones y el % al primer intento por palabra. «Practicar solo» (`IndependentSession`, D16) se abre con ≥3 palabras dominadas, usa ensayos N4, nunca repite la misma palabra seguida y termina a los 10 aciertos o a los 4 min, y termina con un dato curioso (`facts.ts`). No cuenta para el dominio.
- **Candado para adultos** (D6): el panel del tutor se abre manteniendo presionado 2 s.
- **Sensorial** (§7): paleta suave, botones ≥ 56 px, volumen ajustable con tope, sin parpadeos, animaciones < 1 s, respeta `prefers-reduced-motion` y tiene interruptor propio.

- **Pantalla sin scroll** (§3.7, D15): `.screen.play` mide `100dvh` con `overflow:hidden`; opciones apiladas en flex; `.word` ajusta su tamaño con `cqi` y `--n` (letras). Prueba: `npm run test:layout` (Chrome + playwright-core, 360×640 y 412×915).

## Sin conexión
Firestore usa `persistentLocalCache` (IndexedDB): las sesiones se registran sin red y se sincronizan al volver. El *service worker* guarda la app. Borrar la cuenta sí requiere conexión.

## Arte
Las 15 ilustraciones del mazo son SVG vectoriales originales escritos por código, sin IA generativa ni referencias externas, en `src/art/` (ABEJA, MIEL y FLOR por Diversa; las otras 12 por Codelius). Estilo y paleta: [estilo-mazo-abejas.md](estilo-mazo-abejas.md). `src/deck.ts` las carga y prefija sus `id` internos para que no choquen en pantalla.

## Audio
La voz es **provisional**: `speechSynthesis` del dispositivo en es-MX (la calidad depende del sistema). Se reemplazará por grabaciones de voz natural y pausada. El refuerzo es sintetizado (dos notas senoidales suaves, ≈ 0.7 s, ganancia máx. 0.18 × volumen).

## Desarrollo
```
npm ci
npm run dev          # servidor local
npm test             # pruebas unitarias
npm run test:rules   # reglas con el emulador (requiere Java 11+)
npm run build
```

## Despliegue de reglas (manual, una vez y cada vez que cambien)
```
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project mis-palabras-82a77
```
