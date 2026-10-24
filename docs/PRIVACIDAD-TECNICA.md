# Privacidad técnica

Cómo el código cumple los requisitos de privacidad del [README](../README.md).

| Requisito | Implementación |
|---|---|
| 1. Cada familia tiene su cuenta | Inicio de sesión con Google; el `uid` de la cuenta es la familia. |
| 2. Nadie ve datos de otra familia | `firestore.rules`: solo `request.auth.uid == uid` lee/escribe `families/{uid}/**`; todo lo demás se niega (incluidas consultas *collection group*). Probado en `tests/rules`. La app no tiene panel de administrador ni lectura cruzada. |
| 3. Apodo, no nombre real | `children/{childId}` solo admite `nickname` (1–20 caracteres) y `createdAt`; la interfaz pide «Apodo (no el nombre real)». Los ensayos guardan un `childId` aleatorio, no el apodo. |
| 4. Exportar o borrar todo | Panel del tutor: **Exportar JSON/CSV**, **Borrar este perfil** (borra `children/{childId}` y todos los ensayos y sesiones con ese `childId`, y con ellos su progreso, que se calcula a partir de los ensayos; no toca otros perfiles ni la cuenta) y **Borrar todos los datos y la cuenta** (borra todos los documentos de la familia, después la cuenta de Firebase Auth y la caché local). |
| 5. Sin analítica de terceros | No se importa `firebase/analytics` ni otro rastreador; sin anuncios ni compras. Fuentes del sistema (sin CDN). |
| 6. Datos mínimos | Ver abajo. Las reglas rechazan cualquier campo extra. |

## Datos que se guardan
`families/{uid}/children/{childId}`: `nickname`, `createdAt`.

`families/{uid}/trials/{id}` (registro por ensayo, `docs/mecanica-inicial.md` §8): `word`, `correct` (acierto al primer intento sin ayuda), `at` (fecha y hora), y lo mínimo para decidir dominio y ayudas: `cardType`, `help`, `latencyMs`, `childId` y `sessionId` (aleatorios). Opcionales (D13): `mode` (tutor / independiente) y `helps` (0–10); (D16) `level` (1–5) y `miss` (la primera respuesta fue incorrecta). Los ensayos no se editan.

`families/{uid}/sessions/{id}` (D13): `childId`, `mode`, `deck`, `startedAt`, `endedAt`, `durationMs`, `trials`. Sin apodo ni contenido; no se editan. El progreso se deriva de ensayos y sesiones, y borrar un perfil borra sus ensayos y sus sesiones, y con ellos su progreso (en la nube y en la caché local de Firestore).

No se guardan nombres reales, fotos, audio, ubicación ni identificadores del dispositivo. Ajustes (volumen, espera, duración) quedan solo en el dispositivo (`localStorage`).

## La configuración de Firebase es pública
`src/config.ts` identifica el proyecto; no es un secreto. La protección son las reglas y los dominios autorizados. El repositorio no contiene llaves privadas ni cuentas de servicio.

## Modo de prueba
«Probar sin cuenta» guarda todo en memoria y lo pierde al cerrar la página.

## Pasos manuales pendientes
1. Desplegar `firestore.rules` (ver ARQUITECTURA.md). Hasta entonces la base usa las reglas de «modo producción», que niegan todo.
2. Agregar `jjmbrooks.github.io` en Authentication → Configuración → Dominios autorizados.
