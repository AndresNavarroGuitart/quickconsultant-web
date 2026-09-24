# Documento técnico-funcional — Potrero Deportivo

**Fecha:** 24/09/2026
**URL de producción:** https://potrero.quickconsultant.com.ar

---

## 1. Qué es la aplicación

Potrero Deportivo es una aplicación web (SaaS) para que deportistas amateurs — o sus padres/madres, en el caso de menores — lleven el registro de su carrera deportiva: perfil, clubes por los que pasaron, partidos jugados y estadísticas de rendimiento a lo largo del tiempo.

Funciona con un modelo de suscripción mensual con período de prueba gratuito, y soporta múltiples deportes con catálogos de estadísticas propios para cada posición.

**Deportes soportados hoy:** Fútbol, Rugby, Tenis, Hockey, Básquet, Pádel, Vóley, Golf (8 deportes, con posiciones y estadísticas propias por cada uno — ver sección 6).

### Funcionalidades principales

- **Perfil deportivo**: nombre, deporte, posición, altura, número de camiseta, foto. Hasta 2 perfiles por cuenta (por ejemplo, el propio y el de un hijo/a).
- **Clubes**: historial de clubes/equipos por los que pasó el deportista, con fechas, liga y rol.
- **Partidos**: registro de cada partido jugado, con dos formas de cargarlos (ver sección 7):
  - Formulario manual (después de jugar).
  - Registro en vivo (durante el partido, tocando cada jugada).
- **Estadísticas**: historial de partidos, gráfico de resultados (ganados/empatados/perdidos), y estadísticas detalladas agregadas según el deporte/posición, con filtros por club, campeonato, rival y partido puntual.
- **Notificaciones**: buzón de avisos que el equipo de Potrero le manda a los usuarios (individual o masivo).
- **Sugerencias**: buzón para que los usuarios le escriban ideas o reportes al equipo.
- **Suscripción**: pago recurrente mensual vía MercadoPago, con trial gratuito de 7 días para cuentas nuevas.
- **Onboarding**: tour guiado de 4 pasos que se muestra la primera vez que alguien entra, y que se puede volver a ver desde un ícono de ayuda.
- **Panel de administración**: gestión de usuarios, actividad, pagos, sugerencias, notificaciones y auditoría (ver sección 9).

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework web | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS 4 |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL (hosteada en Supabase) |
| ORM | Prisma 7 (con `@prisma/adapter-pg`) |
| Autenticación | Supabase Auth (email + contraseña) |
| Almacenamiento de archivos | Supabase Storage |
| Pagos | MercadoPago (suscripciones recurrentes vía API de Preapproval) |
| Validación de datos | Zod |
| Hosting / CI-CD | Netlify (`@netlify/plugin-nextjs`), deploy automático al pushear a `master` |
| Analítica | Google Analytics 4 (opcional, solo en producción) |

No hay backend separado: todo corre dentro de la misma app Next.js (Route Handlers bajo `src/app/api/`), con Prisma conectándose directo a Postgres.

---

## 3. Arquitectura general

```
┌─────────────┐        HTTPS         ┌──────────────────────────────────────┐
│  Navegador  │◄────────────────────►│         Next.js (Netlify)             │
│  (usuario)  │                      │                                        │
└─────────────┘                      │  ┌──────────────┐   ┌───────────────┐ │
                                      │  │ App Router   │   │ Route Handlers│ │
                                      │  │ (Server      │   │ (/api/**)     │ │
                                      │  │  Components) │   │               │ │
                                      │  └──────┬───────┘   └───────┬───────┘ │
                                      │         │                   │         │
                                      │         └────────┬──────────┘         │
                                      │                  │                    │
                                      │           ┌──────▼───────┐            │
                                      │           │ Prisma Client │            │
                                      │           └──────┬───────┘            │
                                      └──────────────────┼────────────────────┘
                                                          │
                        ┌─────────────────────────────────┼───────────────────┐
                        │                                 │                   │
                 ┌──────▼───────┐               ┌─────────▼────────┐  ┌───────▼──────┐
                 │  PostgreSQL   │               │  Supabase Auth    │  │   Storage    │
                 │  (Supabase,   │               │  (cookies de      │  │  (fotos de   │
                 │  vía pooler)  │               │   sesión, ssr)    │  │   perfil/    │
                 └───────────────┘               └────────────────────┘  │   partido)   │
                                                                          └──────────────┘

                                      ┌─────────────────────┐
                                      │   MercadoPago API    │◄── checkout (PreApproval)
                                      │  (suscripciones)      │──► webhook (notifica cambios
                                      └─────────────────────┘     de estado, firma HMAC)
```

El navegador solo le habla directo a Supabase para dos cosas puntuales: el flujo de login/logout/cambio de contraseña (`@supabase/ssr` del lado del cliente) y para mostrar las fotos ya subidas (URLs públicas de Storage). Todo lo demás — leer/escribir partidos, clubes, perfil, notificaciones, etc. — pasa por los Route Handlers de Next.js, que son los únicos que tienen la connection string de Postgres y las claves de Supabase con privilegios.

---

## 4. Autenticación y autorización

### 4.1. Quién guarda qué

- **Credenciales (contraseña, hash, tokens de sesión)**: viven enteramente en Supabase Auth (`auth.users`), la app nunca las toca ni las guarda.
- **Datos de negocio del usuario** (`public.User` y el resto de las tablas): viven en la base propia, con el mismo `id` que el usuario de Supabase Auth para poder cruzarlos.

### 4.2. Refresco de sesión

`src/proxy.ts` es el equivalente al `middleware.ts` de versiones anteriores de Next.js (Next 16 lo renombró a `proxy.ts`). Corre en cada request y se encarga únicamente de refrescar el token de sesión de Supabase si hace falta; no hace ningún control de acceso de negocio ahí.

### 4.3. Gating de negocio (dónde se decide quién puede ver qué)

El control de acceso real vive en dos lugares:

1. **Layouts de página** (`src/app/(app)/layout.tsx` y `src/app/(admin)/layout.tsx`): cada uno resuelve la sesión, valida el estado de la cuenta, y redirige si corresponde. Como todas las páginas de cada sección cuelgan de su layout, no hace falta repetir el chequeo en cada página.
2. **Helpers para Route Handlers** (`src/lib/auth/`), porque las rutas de API no pasan por el layout:
   - `getSessionContext()`: punto único que resuelve sesión + fila de `User` + estado de acceso (trial/suscripción/bloqueo) + perfil activo. Todo lo demás se construye sobre esta función.
   - `requireGatedProfile()`: exige sesión + acceso activo (trial vigente o suscripción) + un perfil cargado. Es lo que usan las rutas de clubes y partidos.
   - `requireAdmin()`: exige sesión + `isAdmin = true`. Es lo que usan todas las rutas bajo `/api/admin/`.

### 4.4. Estados de una cuenta

Una cuenta puede estar en distintos estados, cada uno con su propia pantalla/redirección:

| Estado | Campo en `User` | Efecto |
|---|---|---|
| Activa (trial o suscripción vigente) | — | acceso normal |
| Trial vencido sin suscripción | `trialEndsAt` en el pasado | bloqueada, se le pide suscribirse |
| Bloqueada por admin | `blockedAt` | redirige a `/cuenta-bloqueada`, gana por sobre cualquier otro estado (ni el trial ni ser admin la salvan) |
| Dada de baja | `deletedAt` | redirige a `/cuenta-eliminada`, datos ya anonimizados/borrados |
| Términos no aceptados | `termsAcceptedAt = null` | redirige a `/aceptar-terminos` |

### 4.5. Perfiles múltiples por cuenta

Una cuenta puede tener hasta 2 `AthleteProfile` (constante `MAX_PROFILES_PER_USER`), pensado para el caso de un padre/madre que además de su propio perfil carga el de un hijo/a. Cuál de los dos está "activo" en un dispositivo puntual se guarda en una cookie (`active_profile_id`, `httpOnly`), no en la base — cada dispositivo puede estar mirando un perfil distinto de la misma cuenta.

---

## 5. Modelo de datos

Tablas principales (ver `prisma/schema.prisma` para el detalle completo):

- **`User`** — la cuenta. Guarda el estado de acceso (`trialEndsAt`, `blockedAt`, `deletedAt`, `termsAcceptedAt`) y si es admin (`isAdmin`). El `id` es el mismo que el de Supabase Auth.
- **`AthleteProfile`** — el perfil deportivo (hasta 2 por `User`). Incluye los campos de un menor a cargo (`subjectType`, `guardianName`, `guardianConsentAt`) cuando corresponde.
- **`Club`** — entidad global (no pertenece a un solo atleta); distintos atletas pueden compartir el mismo club.
- **`AthleteClub`** — el paso de un perfil por un club puntual (fechas, liga, rol, número de camiseta en ese club).
- **`Match`** — un partido. La estadística del partido se guarda en una columna `Json` (`stats`) con forma `{ [statKey]: number | boolean }`, cuyas keys dependen del catálogo de deporte/posición (ver sección 6) — no son columnas fijas. *(Nota: el modelo conserva columnas viejas de fútbol de una versión anterior — `goals`, `saves`, `yellowCards`, etc. — marcadas como deprecadas en el propio schema; ya no se leen ni se escriben, solo siguen ahí para no forzar una migración destructiva.)*
- **`Photo`** — fotos asociadas a un partido (o al avatar del perfil, que es un campo directo en `AthleteProfile`).
- **`Subscription`** / **`Payment`** — estado de la suscripción de MercadoPago y el historial de pagos asociados.
- **`Suggestion`** — sugerencias que manda un usuario, con estado (`NEW`, `PLANNED`, `IN_PROGRESS`, `DONE`, `REJECTED`) y nota de respuesta del admin.
- **`Notification`** — una fila por destinatario (un envío masivo inserta N filas, una por usuario, todas con el mismo `title`/`body`/`createdAt`; la pantalla de admin las reagrupa por esa combinación para mostrarlas como "un envío").
- **`AdminActionLog`** — auditoría de toda acción administrativa sensible (quién, sobre quién, qué acción, cuándo).

---

## 6. Catálogo de deportes, posiciones y estadísticas

El corazón de la flexibilidad de la app es `src/lib/athlete/sportsCatalog.ts`: un catálogo único (deporte → posiciones → estadísticas) que define, para cada combinación, qué campos se piden en el formulario de partido y qué se muestra en Estadísticas.

- Cada estadística (`StatDef`) tiene un tipo (`number`, `boolean` o `percent`) y, opcionalmente, una **fórmula** (`StatFormula`) que la calcula sola a partir de otras estadísticas del mismo partido en vez de pedirla a mano. Hay tres tipos de fórmula:
  - `sum`: suma de otras stats (ej. "duelos totales ganados" = terrestres + aéreos).
  - `percent`: porcentaje entre dos grupos de stats (ej. "% de pases correctos" = correctos / intentados).
  - `zero`: un booleano que da `true` si otra stat dio exactamente 0 en ese partido (ej. "valla invicta" = goles recibidos == 0).
- Una estadística puede además tener un límite (`atMost`) contra otra (ej. "pases correctos" no puede superar a "pases intentados"), validado tanto en el formulario como server-side (`validateStatConsistency`).
- Las estadísticas calculadas **nunca se guardan** en la base: se derivan al mostrarlas, tanto para un partido individual como agregadas en Estadísticas (donde además se suman primero los componentes y recién ahí se calcula el porcentaje total, para no promediar porcentajes de partidos con distinta cantidad de jugadas).

Este mismo catálogo es la fuente para el registro en vivo (sección 7): las acciones que se tocan durante un partido (`src/lib/athlete/liveActions.ts`) suman directamente a las keys que define el catálogo para esa posición.

---

## 7. Registro de partidos: dos formas de cargarlos

1. **Formulario manual** (`PartidosManager.tsx`): se completa después de jugar. Muestra los campos según el deporte/posición del perfil, con las estadísticas calculadas mostradas como cajas de solo lectura ("se calcula solo").

2. **Registro en vivo** (`/partidos/en-vivo`, `LiveMatchTracker.tsx`): pensado para usarse durante el partido, desde el celular. Cada estadística de la posición tiene un botón; tocarlo suma 1. Diseño:
   - Acciones "grandes" (pares ganado/perdido, con color verde/rojo y un ícono de check/cruz) para las jugadas más frecuentes de esa posición.
   - Acciones "chicas" en una sola fila para conteos simples (goles, asistencias, tarjetas, etc.).
   - Un botón "−" sutil en cada acción para corregir un toque de más.
   - El resultado final (ganado/empatado/perdido) se calcula solo a partir de los goles cargados durante el partido — no se puede seleccionar a mano.
   - El progreso se guarda en `localStorage` del celular (no en el servidor) mientras dura el partido, para no perder nada si se bloquea la pantalla o se cierra el navegador por accidente; se sube a la base recién al guardar el partido terminado.
   - Disponible hoy para las 5 posiciones de campo de fútbol (Arquero, Defensor Central, Lateral, Mediocampista, Enganche, Delantero — todas comparten el mismo formato de estadísticas). Para el resto de los deportes/posiciones solo existe la carga manual.

---

## 8. Suscripciones y pagos (MercadoPago)

- Modelo de **suscripción recurrente** (`PreApproval` de MercadoPago), no pagos sueltos.
- `POST /api/mercadopago/checkout` crea la preapproval en MercadoPago y guarda una fila `Subscription` en estado `PENDING`; devuelve la URL de checkout de MercadoPago para redirigir al usuario.
- `POST/GET /api/mercadopago/webhook` recibe las notificaciones de MercadoPago (cambios de estado de la suscripción, pagos nuevos) y actualiza `Subscription`/`Payment` en consecuencia. Valida la firma HMAC del webhook antes de procesar nada.
- El monto y la moneda de la suscripción están centralizados en `src/lib/mercadopago/pricing.ts` (una sola fuente de verdad, usada tanto por el checkout real como por los textos de precio en la landing y en `/suscripcion`).
- El acceso de un usuario (`hasActiveSubscription`) se resuelve buscando si tiene alguna `Subscription` con estado `AUTHORIZED` — no depende de mirar `Payment` directamente.

---

## 9. Panel de administración

Todo bajo `/admin`, protegido por `isAdmin = true` en el layout de esa sección:

- **Resumen** (`/admin`) — vista general.
- **Usuarios** (`/admin/usuarios`) — extender trial, revocar acceso, dar/sacar admin, bloquear/desbloquear cuenta, otorgar/revocar suscripción gratuita.
- **Actividad** (`/admin/actividad`) — uso real por usuario (perfil, clubes, partidos, último acceso vía Supabase Auth), ordenado por último acceso, con buscador por email o perfil.
- **Pagos** (`/admin/pagos`) — historial de pagos y suscripciones.
- **Sugerencias** (`/admin/sugerencias`) — gestión de estado y respuesta a sugerencias de usuarios (la respuesta genera una `Notification` automática al usuario).
- **Notificaciones** (`/admin/notificaciones`) — enviar avisos (a todos o a un usuario puntual), y editar/borrar envíos ya hechos.
- **Auditoría** (`/admin/auditoria`) — listado de `AdminActionLog`: toda acción administrativa sensible queda registrada con quién la hizo, sobre quién, y cuándo.

---

## 10. Seguridad

Ver documento aparte: [`AUDITORIA-SEGURIDAD.md`](./AUDITORIA-SEGURIDAD.md). En resumen: la autorización a nivel de aplicación (ownership, roles, validación de entrada) está bien resuelta; el punto pendiente de mayor prioridad es actualizar la versión de Next.js por vulnerabilidades públicas conocidas en la versión actual.

---

## 11. Despliegue y entornos

- **Hosting**: Netlify, con el plugin oficial `@netlify/plugin-nextjs`.
- **CI/CD**: deploy automático en cada push a la rama `master` del repo (`quickconsultant-web`, monorepo — esta app vive en el subdirectorio `perfil-deportivo-app/`).
- **Build**: `prisma migrate deploy && next build` — las migraciones de base de datos pendientes se aplican automáticamente en cada build, antes de compilar la app.
- **Entornos**: no hay un ambiente de "staging" separado — el desarrollo local (`.env.local`) apunta a la misma base de datos de Supabase que producción. Las variables de entorno de producción se manejan aparte en la configuración de Netlify.
- **Variables de entorno relevantes**: credenciales de Supabase (URL, `anon key`, `service_role key`), connection string de Postgres, credenciales de MercadoPago (access token + webhook secret), y un interruptor de desarrollo (`DISABLE_ACCESS_GATING`) para desactivar el bloqueo por trial vencido mientras se construye la app — confirmado en `false` en producción.

---

## 12. Limitaciones conocidas / deuda técnica

- El modelo `Match` conserva columnas de una versión anterior del sistema de estadísticas (solo fútbol, antes de existir el catálogo por deporte/posición) que ya no se usan pero siguen en el schema.
- No hay ambiente de staging: los cambios se prueban localmente contra la base de producción (con cuidado de no tocar datos reales) antes de deployar.
- El registro en vivo (tap-to-count) solo existe para fútbol de campo; el resto de los deportes/posiciones se cargan solo a mano.
- El tour de onboarding y la preferencia de "ya lo vi" viven en `localStorage` del navegador, no en la cuenta — no se sincroniza entre dispositivos, y un usuario que entra desde un celular nuevo lo vuelve a ver.
- Sin rate limiting propio a nivel de aplicación (ver auditoría de seguridad, hallazgo de severidad media).
