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
- **Presentación** (§3.1): la primera vez que aparece una palabra objetivo en la sesión se muestra la carta imagen + texto y suena la palabra; el tutor puede tocarla para repetir.
- **Ensayo** (§3.2): la voz dice «Toca MIEL»; 2 opciones, 3 cuando la palabra supera el 80 % en la sesión (con ≥ 2 intentos); posiciones mezcladas; opciones habilitadas ≥ 1 s después de iniciar; las opciones no suenan antes de tocar; tras tocar suena la palabra elegida.
- **Acierto** (§3.3): resalta la carta, sonido suave (< 1 s), «¡MIEL, muy bien!» y +1 moneda.
- **Error o duda** (§3.4): sin sonido negativo. Error o espera de 3–5 s (configurable) sube la ayuda: **A** resalta la correcta, **B** muestra la carta modelo imagen + texto, **C** pide guía del tutor y deja activa solo la correcta. Después se repite el ensayo y se intercala una palabra conocida.
- **Sesión** (§4): 2–4 palabras objetivo (se evitan PAN/PANAL y MAMÁ/PAPÁ juntas), 12 ensayos (máx. 15), termina en acierto; límite 5–10 min (8 por defecto) con barra que se vacía y aviso «Ya casi terminamos»; botón Terminar.
- **Dominio** (§5): ≥ 90 % al primer intento sin ayuda en 2 sesiones seguidas sube de nivel (imagen + texto → emparejar letras → solo texto → dominada); < 60 % en 2 sesiones seguidas baja un nivel. Pendiente para fases siguientes: repaso espaciado, variante «sin imagen desde el inicio», comprobación con tarjetas físicas, palabras propias.
- **Candado para adultos** (D6): el panel del tutor se abre manteniendo presionado 2 s.
- **Sensorial** (§7): paleta suave, botones ≥ 56 px, volumen ajustable con tope, sin parpadeos, animaciones < 1 s, respeta `prefers-reduced-motion` y tiene interruptor propio.

## Sin conexión
Firestore usa `persistentLocalCache` (IndexedDB): las sesiones se registran sin red y se sincronizan al volver. El *service worker* guarda la app. Borrar la cuenta sí requiere conexión.

## Arte
Las ilustraciones de la app son **marcadores temporales**: SVG simples escritos por código en `src/deck.ts` para este repositorio (sin IA generativa ni referencias externas). El arte definitivo del mazo (SVG kawaii por código) está en revisión y se integrará cuando se apruebe.

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
