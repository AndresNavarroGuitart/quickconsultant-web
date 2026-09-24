# Auditoría de seguridad — Potrero Deportivo

**Fecha:** 24/09/2026
**Alcance:** aplicación `perfil-deportivo-app` (Next.js + Supabase + MercadoPago), código fuente completo y pruebas en vivo contra la infraestructura de producción (Supabase, sin alterar datos).
**Metodología:** revisión manual de código (rutas de API, autenticación, autorización, validación de entrada, manejo de archivos, integración de pagos), `npm audit` sobre dependencias, y pruebas de reconocimiento de solo lectura/escritura fallida contra la API REST y Storage de Supabase con la clave pública (`anon key`) para confirmar que los permisos a nivel de base de datos son los esperados.

---

## Resumen ejecutivo

La aplicación tiene una base de seguridad **sólida a nivel de código de aplicación**: todas las rutas de escritura validan entrada con Zod, verifican propiedad del recurso (sin IDOR detectado), separan correctamente las claves de Supabase (`anon` vs `service_role`), nunca comprometen secretos en git, y tienen cabeceras de seguridad (CSP, HSTS, etc.) bien configuradas. El webhook de MercadoPago valida firma HMAC correctamente.

El hallazgo más importante **no estaba en el código propio sino en una dependencia**: la versión de Next.js instalada (`16.2.10`) tenía vulnerabilidades públicas de severidad **crítica**, incluyendo ejecución remota de código no autenticada.

> **✅ Actualizado el 24/09/2026.** Se subió Next.js a `16.3.6` (última estable de la rama 16.x), se re-corrió `npm audit` y se verificó con build + pruebas manuales en el preview que la app sigue funcionando igual. Ver detalle al final de este hallazgo.

| Severidad | Cantidad | Estado |
|---|---|---|
| 🔴 Crítica | 1 | ✅ Resuelto |
| 🟠 Alta | 1 (dependencias transitivas de Next.js) | ✅ Resuelto |
| 🟠 Alta | 1 (dependencias transitivas del CLI de Prisma) | Sin resolver — ver nota |
| 🟡 Media | 2 | Pendiente (no urgente) |
| 🔵 Baja / refuerzo | 3 | Pendiente (no urgente) |

---

## Hallazgos

### ✅ RESUELTO — Next.js desactualizado, múltiples CVEs incluyendo RCE no autenticado

**Dónde:** `perfil-deportivo-app/package.json` — `"next": "16.2.10"`

`npm audit` reporta que la versión instalada cae dentro del rango vulnerable (`9.3.4-canary.0` – `16.3.2`) de varios avisos, entre ellos:

- **GHSA-2xp9-vwfh-vxw4** — Ejecución remota de código no autenticada en la API de optimización de imágenes (`/_next/image`) cuando se procesan archivos AVIF. Esta ruta existe en cualquier servidor Next.js por defecto, se use o no el componente `<Image>` en el código (se confirmó que esta app no usa `next/image`, pero eso no desactiva la ruta del framework).
- **GHSA-p293-qw3h-jr36** — RCE no autenticado en servidores hosteados en Windows. No aplica al hosting actual (Netlify, funciones Linux), pero sí aplicaría si alguna vez se corre en Windows (IIS, etc.).
- **GHSA-955p-x3mx-jcvp** — Exposición no autenticada de endpoints internos de Server Functions.
- **GHSA-89xv-2m56-2m9x** y **GHSA-p9j2-gv94-2wf4** — SSRF en Server Actions y en rewrites con hostname controlado por el atacante.
- **GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q** — confusión de caché de respuestas entre requests distintos (podría filtrar la respuesta de un usuario a otro).
- **GHSA-q8wf-6r8g-63ch** — denegación de servicio vía SVGs en la API de optimización de imágenes.

**Impacto:** alto — algunas de estas fallas no requerían autenticación ni interacción del usuario.

**Resolución aplicada:** se actualizó `next` y `@next/third-parties` a `16.3.6`, y `eslint-config-next` a la misma versión para mantenerlos alineados. Se verificó:
- `npm audit --omit=dev` ya no reporta ningún hallazgo de `next` (el crítico desapareció por completo).
- Build limpio (`rm -rf .next && npm run build`) sin errores.
- `tsc --noEmit` sin errores de tipos.
- Prueba manual en el preview: login, Estadísticas (dona + tarjetas), Partidos, Registro en vivo, y el panel de admin (Resumen, Notificaciones) — todo funciona igual que antes de la actualización.

---

### ✅ RESUELTO — Vulnerabilidades en dependencias transitivas de tooling

**Dónde:** `npm audit --omit=dev`

Además de Next.js, `npm audit` marcaba como "high" a `postcss` (vulnerabilidad XSS/path traversal, venía empaquetada dentro de `next`) y `sharp` (CVEs heredados de `libvips`/`libheif`, dependencia opcional del optimizador de imágenes de Next.js). Ambas desaparecieron solas al actualizar Next.js a `16.3.6` — no hizo falta ninguna acción adicional.

**Nota — hallazgo nuevo, distinto, sin resolver:** al actualizar quedaron expuestos otros 4 avisos "high" que no tienen que ver con Next.js sino con el **CLI de Prisma** (`deepmerge-ts`, `mysql2`, `fast-uri`, `nanoid`, todos dependencias internas de `prisma`/`@prisma/config`). Se aplicó `npm audit fix` (sin `--force`) y se resolvieron 2 de los 4 (`fast-uri`, `nanoid`) sin ningún cambio de versión mayor. Los 2 restantes (`deepmerge-ts`, `mysql2`) **no se tocaron a propósito**: el único fix que ofrece `npm audit fix --force` es *degradar* Prisma de la versión 7 a la 6 (`prisma@6.19.3`), lo cual sería un downgrade real, no una mejora. Además:
- `mysql2` es el driver de MySQL que trae el CLI de Prisma para usuarios de esa base de datos — esta app usa Postgres, nunca se ejecuta ese código.
- Ninguna de las dos corre en producción: son dependencias del **CLI** de Prisma (`prisma migrate deploy`, que corre una vez en cada build), no del **cliente** de Prisma que sí queda en el bundle de la app.

**Recomendación:** no forzar el downgrade. Revisar de nuevo cuando Prisma publique una versión 7.x o 8.x estable que actualice esas dependencias internas (`npm audit` cada tanto, como se sugiere más abajo).

---

### 🟡 MEDIO — Validación de imágenes subidas solo por tipo declarado, no por contenido real

**Dónde:** [`src/app/api/photos/upload/route.ts`](../src/app/api/photos/upload/route.ts)

La ruta valida `file.type` contra una lista blanca (`image/jpeg`, `image/png`, `image/webp`) y el tamaño máximo (10MB), lo cual está bien. Pero `file.type` es un valor que **declara el cliente** en el `multipart/form-data`, no algo que se verifique contra los bytes reales del archivo. Un atacante podría enviar una request forjada (sin pasar por el input de archivo del navegador) con `Content-Type: image/jpeg` declarado pero contenido arbitrario adentro.

**Impacto:** acotado — la lista blanca excluye `image/svg+xml`, `text/html` y similares, que son los formatos típicamente usados para XSS almacenado vía archivos, así que un archivo "disfrazado" no se ejecutaría como script en el navegador al abrirlo. El riesgo real es más bien de robustez (archivos corruptos rompiendo algún visor de imágenes, o abuso de espacio de almacenamiento) que de ejecución de código.

**Recomendación (buena práctica, no urgente):** validar los primeros bytes del archivo (magic numbers) o re-codificar la imagen server-side (por ejemplo con `sharp`, ya presente como dependencia transitiva) antes de subirla a Storage. Esto además evitaría depender de una librería con CVEs propios sin actualizar (ver hallazgo anterior).

---

### 🟡 MEDIO — Sin límite de frecuencia (rate limiting) propio en endpoints de escritura

**Dónde:** todas las rutas bajo `src/app/api/**` que aceptan `POST`/`PATCH` de un usuario autenticado (sugerencias, notificaciones, partidos, clubes, etc.)

No hay ningún mecanismo propio de la aplicación que limite cuántas requests puede hacer una cuenta autenticada en un lapso de tiempo. Netlify y Supabase tienen sus propios límites de plataforma, y el login/signup está protegido por los límites propios de Supabase Auth, pero un usuario ya logueado podría, por ejemplo, hacer un loop creando cientos de sugerencias o partidos por segundo.

**Impacto:** bajo — requiere una cuenta válida (no es un vector anónimo), y el daño más probable es spam/ruido en la base o un pico de costo de infraestructura, no una brecha de datos.

**Recomendación:** opcional a mediano plazo. Si se quiere resolver simple y sin infraestructura nueva, alcanza con un contador simple en Postgres (ej. rechazar si el mismo usuario creó más de N filas en el último minuto) para los endpoints más sensibles (`suggestions`, `matches`, `athlete-clubs`).

---

### 🔵 BAJO — Baja de cuenta no pide reautenticación

**Dónde:** [`src/app/api/account/delete/route.ts`](../src/app/api/account/delete/route.ts), [`src/lib/validation/accountSchema.ts`](../src/lib/validation/accountSchema.ts)

La baja de cuenta (irreversible: borra perfiles, fotos, clubes, partidos y sugerencias) exige escribir la palabra "ELIMINAR" como confirmación, pero no pide la contraseña de nuevo. Si alguien deja una sesión abierta sin bloquear el dispositivo, cualquiera con acceso físico momentáneo podría borrar la cuenta.

**Impacto:** bajo — es el mismo nivel de riesgo que cualquier otra acción destructiva de la sesión activa (ej. borrar todos los partidos uno por uno ya sería posible igual). No es una falla de autenticación, es una capa extra de fricción que falta.

**Recomendación:** opcional. Si se quiere reforzar, se puede pedir la contraseña actual (via `supabase.auth.signInWithPassword` de nuevo) antes de confirmar la baja.

---

### 🔵 BAJO — Bucket de fotos con URLs públicas (por diseño, documentado)

**Dónde:** [`src/app/api/photos/upload/route.ts`](../src/app/api/photos/upload/route.ts), bucket `athlete-photos` en Supabase Storage

Las fotos de perfil y de partidos se suben a un bucket cuyas URLs son públicas (`getPublicUrl`): cualquiera que conozca (o adivine) la URL exacta puede verla, sin necesidad de estar logueado. Se verificó en vivo que el bucket **no es listable ni escribible** por la clave pública (`anon`) — solo la ruta exacta con el UUID aleatorio del archivo es accesible.

**Impacto:** ninguno mientras las URLs sigan siendo UUIDs impredecibles (128 bits de aleatoriedad) y no se linkeen en ningún lugar público fuera de la cuenta del dueño del perfil. Es un diseño razonable para fotos de perfil deportivo, que no son datos altamente sensibles.

**Recomendación:** ninguna acción requerida; solo dejarlo documentado como decisión de diseño consciente (ya está así en el comentario del código), y tenerlo en cuenta si en el futuro se sube algún tipo de foto más sensible.

---

## Fortalezas encontradas

Vale la pena dejar constancia de lo que está bien resuelto, porque son justamente los puntos donde más suelen aparecer vulnerabilidades reales en apps similares:

- **Autorización consistente en todas las rutas de API.** Se revisaron las ~20 rutas bajo `src/app/api/` y todas pasan por `getSessionContext`, `requireGatedProfile` o `requireAdmin` antes de tocar datos. Las rutas que reciben un `:id` en la URL (partidos, clubes, fotos, notificaciones) siempre verifican que el recurso pertenezca al usuario autenticado antes de leer/escribir — no se encontró ningún caso de IDOR (acceso a datos de otro usuario cambiando un id en la URL).
- **Separación correcta de claves de Supabase.** La `anon key` (pública, `sb_publishable_...`) es la única que viaja al navegador; la `service_role key` (`sb_secret_...`, que bypasea todos los permisos) solo se usa en un único archivo server-side (`src/lib/supabase/admin.ts`) y nunca se referencia desde un componente cliente.
- **Permisos de base de datos verificados en vivo.** Se probó con la `anon key` contra la API REST de Supabase (PostgREST) sobre las 10 tablas principales (`User`, `AthleteProfile`, `Match`, `Subscription`, `Payment`, etc.) y todas devuelven `403 permission denied` — el rol público no tiene ningún `GRANT` sobre las tablas de negocio, así que aunque alguien extraiga la `anon key` del bundle del navegador (es pública por diseño), no puede leer ni escribir nada directo en la base.
- **Storage verificado en vivo.** Se probó listar el bucket `athlete-photos` y subir un archivo con la `anon key`: listar objetos devuelve vacío (no enumerable) y subir fue rechazado por política de Row Level Security (`403 - new row violates row-level security policy`). Solo el `service_role` (usado exclusivamently server-side) puede escribir.
- **Webhook de MercadoPago con validación de firma.** [`src/app/api/mercadopago/webhook/route.ts`](../src/app/api/mercadopago/webhook/route.ts) valida el header `x-signature` con `WebhookSignatureValidator` antes de procesar cualquier notificación, y rechaza con 401 si falta el secreto configurado o la firma no matchea — no procesa notificaciones no autenticadas.
- **Sin inyección SQL posible.** Toda la persistencia pasa por Prisma con queries parametrizadas; no se encontró ningún uso de `$queryRawUnsafe`, `$executeRawUnsafe` ni concatenación de strings en queries.
- **Sin XSS vía `dangerouslySetInnerHTML` ni `eval`.** No se encontró ningún uso de estos patrones en todo el código fuente.
- **Secretos nunca comprometidos en git.** Se revisó el historial completo de commits: solo `.env.example` (con valores vacíos/placeholder) está trackeado; `.env.local` está correctamente ignorado en todos los subdirectorios del repo.
- **Cabeceras de seguridad completas.** [`next.config.ts`](../next.config.ts) define `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Permissions-Policy` restrictivo en todas las respuestas.
- **Cookies de sesión correctamente configuradas.** `httpOnly`, `secure` en producción y `SameSite=Lax`, lo que da protección razonable contra CSRF en las rutas de API que dependen de la cookie de sesión.
- **Manejo de datos de menores con cuidado explícito.** Los perfiles de tipo `DEPENDENT` (hijos/as registrados por un padre/madre) guardan `guardianConsentAt` como registro de auditoría del consentimiento, y la baja de cuenta borra también esos datos.
- **Baja de cuenta alineada con minimización de datos.** Anonimiza el email, borra perfiles/fotos/clubes/partidos/sugerencias, y elimina el usuario de Supabase Auth (no solo lo desactiva) — ver [`src/lib/account/deleteAccount.ts`](../src/lib/account/deleteAccount.ts).
- **Auditoría de acciones administrativas.** Toda mutación sensible desde el panel de admin (bloquear cuenta, dar admin, extender trial, editar/borrar notificaciones, responder sugerencias) queda registrada en `AdminActionLog` con quién la hizo, sobre quién, y cuándo.
- **`DISABLE_ACCESS_GATING` correctamente en `false` en producción** — se verificó el valor real configurado en Netlify, no solo el código.

---

## Recomendaciones priorizadas

1. ~~**Actualizar Next.js** a la última versión estable de la rama 16.x~~ — ✅ hecho el 24/09/2026 (`16.2.10` → `16.3.6`).
2. ~~Re-correr `npm audit` después de actualizar~~ — ✅ hecho: `postcss` y `sharp` quedaron resueltos. Quedó un hallazgo nuevo y distinto en el CLI de Prisma (`deepmerge-ts`, `mysql2`), documentado arriba, sin resolver a propósito (el único fix disponible es degradar Prisma a una versión anterior).
3. (Opcional, no urgente) Validar contenido real de imágenes subidas, no solo el MIME declarado.
4. (Opcional, no urgente) Rate limiting básico en endpoints de escritura más usados.
5. (Opcional, no urgente) Pedir contraseña de nuevo antes de confirmar la baja de cuenta.
6. Fijar el hábito de correr `npm audit` cada tanto (aunque sea manualmente antes de cada actualización de dependencias grande), ya que este ciclo mostró que resolver una dependencia puede destapar otra distinta.

Ninguno de los puntos 3 a 5 es explotable hoy de forma práctica; se listan como refuerzos de defensa en profundidad, no como brechas activas.

---

## Anexo — revisión QA externa (24/09/2026)

Una segunda revisión (`REVISION-QA-2026-09-24.md`, hecha por otra persona/herramienta contrastando esta auditoría con el código) encontró **15 hallazgos nuevos** que esta auditoría no cubría, porque se enfocó en seguridad clásica (auth, inyección, secretos) y no en consistencia de negocio/integraciones ni accesibilidad. Verifiqué cada uno contra el código real antes de actuar; de los 15, considero 14 válidos (con matices de severidad en dos de ellos) y uno que no pude confirmar por mi cuenta (ver abajo).

**Ya corregidos y verificados en el preview:**

- **Cuenta bloqueada/dada de baja podía seguir operando la API.** `getSessionContext()` ahora calcula un motivo de rechazo (`denial`), y un nuevo punto único (`requireSession`) lo hace cumplir en todas las rutas — antes, `/api/profile`, `/api/photos/*`, `/api/suggestions`, `/api/notifications` y `/api/mercadopago/checkout` solo chequeaban que hubiera sesión, no que la cuenta estuviera habilitada. También se descubrió que `requireAdmin()` tenía el mismo problema (un admin bloqueado conservaba acceso a `/api/admin/*`). Probado en vivo: bloqueé la cuenta de prueba y confirmé `403` en 5 rutas distintas sin pasar por ninguna pantalla.
- **La baja de cuenta no cancelaba la suscripción de MercadoPago.** Ahora `deleteAccount()` cancela primero cualquier suscripción vigente (aborta la baja entera si esa cancelación falla, en vez de borrar los datos y seguir cobrando igual). Además se agregó un botón "Cancelar suscripción" en `/suscripcion` que no existía — antes la única forma de cancelar era dar de baja toda la cuenta. Probado en vivo: cancelé una suscripción de prueba y confirmé que queda `CANCELLED` en la base y la pantalla vuelve a mostrar el estado real.

**También corregidos y verificados** (segunda tanda, mismo día):

- **Checkout permitía suscripciones duplicadas.** `/api/mercadopago/checkout` ahora rechaza si ya hay una `AUTHORIZED` (409) y reutiliza el mismo checkout si hay una `PENDING` reciente (< 24h) en vez de crear una preapproval nueva cada vez. Se sumó además una `idempotencyKey` por usuario/día como resguardo extra ante una carrera de dos clicks casi simultáneos.
- **El webhook asociaba pagos a la suscripción más reciente, no a la correcta.** Ahora excluye las suscripciones "gratis" (`admin-free-...`) al buscar dónde asociar un pago real, y se agregó manejo del tópico `subscription_authorized_payment` (el que usa MercadoPago específicamente para los cobros recurrentes de una preapproval), que resuelve la suscripción por `preapproval_id` directo en vez de por "la más nueva del usuario". También se dejó de pisar `startedAt` en cada renovación.
- **Fotos sin recodificar del lado del servidor (EXIF/GPS).** `/api/photos/upload` ahora pasa todo por `sharp` antes de subir a Storage: además de sacar los metadatos (incluida la ubicación GPS, relevante para fotos de perfiles de menores), esto valida que el archivo sea una imagen real y no solo lo que declara el `Content-Type` — probado en vivo subiendo una imagen real (se subió como `.jpg` recodificado) y un archivo falso declarado como imagen (rechazado con 400).
- **Llamadas a MercadoPago sin timeout y con error interno filtrado al usuario.** Se agregó `timeout: 5000` al cliente, y el checkout ya no devuelve `err.message` de MercadoPago tal cual (queda en el log del servidor; el usuario ve un mensaje en español).
- **JSON malformado o id inexistente devolvían 500.** Se agregó un helper (`readJson`) usado en las 12 rutas que parseaban `request.json()` sin capturar, y un chequeo de existencia en `/api/admin/users/[id]` antes de cualquier acción (evita la violación de FK del upsert de suscripción gratis y el "Record not found" del update).
- **Envíos masivos de notificaciones incluían cuentas dadas de baja; `listUsers` no paginaba.** El envío "a todos" ahora filtra `deletedAt: null`, y `getLastSignInMap` pagina hasta agotar los resultados en vez de quedarse con los primeros 1000.
- **Alta sin declaración de mayoría de edad.** Se sumó un segundo checkbox obligatorio en el signup (el de Términos ya existía), con su propio timestamp (`ageConfirmedAt`) guardado igual que `termsAcceptedAt`.
- **Modal sin manejo de foco (WCAG 2.4.3 / 4.1.2).** `Modal.tsx` (usado por "Cambiar contraseña" y "Dar de baja mi cuenta") pasó a usar el elemento nativo `<dialog>`: mueve el foco adentro al abrir, lo atrapa, y lo devuelve al cerrar. Probado en vivo: el campo "Contraseña actual" recibe el foco solo al abrir, y Escape cierra correctamente.
- **Contraste insuficiente (WCAG 1.4.3).** `text-slate-400` (2.56:1) se reemplazó por `text-slate-500` (4.76:1) en los ~50 usos como texto en toda la app (no solo los 9 que había visto la revisión — se hizo un barrido completo), dejando `slate-400` únicamente en el estado `disabled:` de inputs, que WCAG exime. `text-accent-500`/`600` sobre texto chico blanco (links "Admin", estado de sugerencia "En desarrollo") pasaron a un nuevo tono `accent-700` (5.2:1); el logo, que es texto grande y en negrita, solo necesitaba subir a `accent-600` (3:1, cumple el mínimo de texto grande).
- **Sin feedback al volver de MercadoPago; estados en inglés.** Si hay una suscripción `PENDING` de menos de 30 minutos, `/suscripcion` muestra un aviso ("Estamos confirmando tu pago...") que se refresca solo cada 7 segundos. La tabla de pagos ahora traduce el estado (Aprobado/Pendiente/Rechazado/etc.) y formatea el monto con `Intl.NumberFormat`.

**No pude verificar por mi cuenta:** la sospecha de que `.env.local` (con la `service_role key`, la contraseña de Postgres de producción y el token de MercadoPago) esté sincronizado por OneDrive al tenant de otra organización, dado el nombre de la carpeta del proyecto. No tengo forma de inspeccionar la configuración de esa cuenta de OneDrive/M365 desde acá — vale la pena que lo confirmes vos directamente.

**Todavía sin abordar** (quedan para cuando decidas seguir): H-03 (staging, rotación de secretos — requieren tu acción directa en los dashboards de Supabase/MercadoPago) y H-04 (MFA para admins — no lo activé para no arriesgarme a dejarte bloqueado del propio panel sin que primero configures un factor en Supabase Auth; la restricción de "solo un owner puede nombrar admins" tampoco se hizo porque necesito que me digas qué cuenta debería ser esa).

**Nota aparte, no relacionada con la auditoría:** de paso encontré (sin buscarlo) un archivo de migración de Prisma corrompido (`20260918102522_baseline`, con un banner de texto de una herramienta de CLI colado al principio del SQL). No lo toqué porque el checksum ya registrado en la base podría no coincidir si lo edito, pero no bloquea el funcionamiento normal — solo rompe si alguna vez hace falta recrear la base desde cero con `prisma migrate dev` o similar (relevante si en algún momento se arma el ambiente de staging de H-03).

---

## Anexo — pendiente antes de subir a producción

Los cambios de este documento (actualización de Next.js, y ahora los dos hallazgos de la revisión QA de arriba) están hechos y verificados localmente (build, typecheck y pruebas manuales en el preview), pero **todavía no se subieron a producción** a la espera de confirmación.
