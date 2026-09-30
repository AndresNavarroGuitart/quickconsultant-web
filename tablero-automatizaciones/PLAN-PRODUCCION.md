# Plan para llevar el Tablero a producción

Objetivo: pasar de "sitio estático público con datos ficticios en `localStorage`"
a una app con **login (Google/Gmail restringido a `@notabotagency.com`), base de
datos real, roles de acceso, cifrado y logging de accesos** — resolviendo los
hallazgos A-01, A-02 y A-03 del análisis ISO 27001 ([[tablero-iso27001]] en las
notas internas; ver también `nomina/EMPLEADOS-SYNC.md`).

Este documento es el **brief técnico** para ejecutar el trabajo (uno mismo, con
Gemini/Claude, o para cotizar con un desarrollador freelance/agencia).

## 0. Decisión de arquitectura

**Recomendado: Firebase** (Auth + Firestore + Hosting, todo de Google).

Por qué:
- Login con Google **nativo**, con restricción de dominio (`hd=notabotagency.com`)
  de forma directa — es exactamente el requisito de "login con Gmail".
- Un solo proveedor (menos piezas que integrar) en vez de combinar
  Netlify + Supabase.
- Gratis (plan Spark) para el volumen de este equipo — ver `PLAN-PRODUCCION.md`
  no, ver la conversación de costos; en resumen: $0/mes hasta 50.000 usuarios
  de auth y 20.000 escrituras/día, muy por encima de lo que este equipo va a usar.
- La infraestructura de Google Cloud (base de Firebase) ya está certificada
  ISO 27001 — ayuda en la cadena de suministro que audita el cliente.

**Alternativa**: Netlify (hosting) + Supabase (auth + Postgres). Válida si en
algún momento prefieren SQL sobre NoSQL, o ya usan Supabase en otro proyecto.
El plan de abajo está detallado para Firebase; los pasos equivalentes en
Supabase son análogos (Supabase Auth en vez de Firebase Auth, Row Level
Security en vez de Firestore Rules, tablas en vez de colecciones).

## Fase 1 — Infraestructura base (1-2 días)

1. Crear el proyecto en **Firebase Console** bajo una cuenta/organización de
   Not a Bot (no una cuenta personal) — idealmente vinculado a Google Cloud
   Identity de `notabotagency.com` si el Workspace lo permite.
2. Habilitar: **Authentication**, **Firestore**, **Hosting**.
3. Configurar el proveedor **Google** en Authentication.
4. Restringir el dominio en dos capas (una sola no alcanza):
   - Cliente: pasar `hd: "notabotagency.com"` en la config del login de Google
     (evita que aparezca la opción de cuentas ajenas).
   - Servidor (la que realmente protege): en las **Firestore Security Rules**,
     rechazar cualquier request cuyo `request.auth.token.email` no termine en
     `@notabotagency.com`. La restricción del cliente es solo UX.

## Fase 2 — Modelo de datos en Firestore (2-3 días)

Migrar el *shape* que ya usan `empleados-demo.js` / `leads-demo.js` /
`proyectos-data.js` directamente como esquema de colecciones — el diseño de
datos ya está resuelto, lo que cambia es el motor de persistencia:

```
empleados/{empId}          — mismo shape que hoy (nombre, documento, cliente,
                              proyecto, equipamiento{}, seguimientos[], relacion{},
                              administracion{}, licencias[], documentos[]…)
leads/{leadId}              — mismo shape que pipeline/leads-demo.js
proyectos/{proyectoId}      — mismo shape que proyectos/proyectos-data.js
accessLogs/{logId}          — nuevo, para la Fase 5
usuarios/{uid}              — perfil + rol de cada persona que loguea
```

Escribir las **Firestore Security Rules** (`firestore.rules`) — es la pieza
central de seguridad, más importante que cualquier chequeo en el frontend.

## Fase 3 — Roles y control de acceso (3-5 días)

Roles sugeridos (ajustar con el equipo):

| Rol | Ve | No ve |
|---|---|---|
| `admin` (RRHH / dirección) | Todo, incluida Administración (banco, remuneración) | — |
| `manager` | Su equipo/proyectos, Datos personales, Asignación, PTO | Administración (datos bancarios) |
| `viewer` | Listado y datos no sensibles | Documentos, Administración, datos bancarios de otros |

Implementación:
1. **Custom Claims** de Firebase Auth: al crear un usuario, una Cloud Function
   (o un admin a mano desde una pantalla interna) le asigna `role: "admin" | "manager" | "viewer"`.
2. Las **Firestore Rules** leen ese claim y deciden qué campos/documentos puede
   leer o escribir cada rol (ej.: el subcampo `administracion` solo lo lee `admin`).
3. En el frontend: ocultar/mostrar secciones según el rol — es solo UX, la
   protección real vive en las Rules del punto 2.

## Fase 4 — Cifrado (2-4 días)

- **En reposo**: Firestore ya cifra todo por defecto (lo gestiona Google) —
  esto resuelve la mitad del hallazgo A-02.
- **En tránsito**: HTTPS automático con Firebase Hosting.
- **Cifrado de campo adicional** (opcional, más estricto) para lo más sensible
  — CBU/cuenta, remuneración: una Cloud Function cifra/descifra esos campos
  puntuales con una clave en **Secret Manager**, de forma que ni un admin de
  Firebase Console vea el valor en texto plano sin pasar por la función.
  Evaluar si el auditor ISO 27001 lo exige o si el cifrado en reposo + Rules
  ya alcanza para este tamaño de organización.

## Fase 5 — Logging de accesos y cambios (2-3 días)

- Colección `accessLogs`: cada vista de ficha o edición escribe
  `{ usuario, empleadoId, accion, timestamp }`.
- Complemento: **Cloud Audit Logs** de Google Cloud ya registra acciones
  administrativas a nivel de plataforma (quién cambió permisos, etc.).
- Agregar una vista simple en el tablero (solo para `admin`) para revisar el
  historial — resuelve el hallazgo A-03.

## Fase 6 — Migrar el frontend (5-8 días, la más grande)

- Reemplazar las funciones `load()` / `save()` (hoy `localStorage`) de
  `nomina.js`, `pipeline.js` y `proyectos.js` por llamadas al SDK de Firestore
  — mismo patrón de funciones, cambia el motor de datos por debajo.
- Agregar la pantalla de login (botón "Ingresar con Google") antes de mostrar
  cualquier vista del tablero.
- El diseño visual **no cambia** — esta fase es swap de la capa de datos, no
  un rediseño.

## Fase 7 — Corte a producción (1-2 días)

1. Pasar el hosting de **GitHub Pages (público)** a **Firebase Hosting**
   (con Auth activo, deja de ser accesible sin login).
2. Recién ahí cargar datos reales — nunca antes de que Auth + Rules estén
   probados y funcionando.
3. El repo `notabot-tablero-operaciones` sigue existiendo como código fuente
   (privado o público da igual, ya no tiene datos reales adentro — viven en
   Firestore) y como demo con datos ficticios si se quiere seguir mostrando.

## Estimación total

~3-4 semanas de trabajo de un desarrollador full-stack (part-time podría ser
6-8 semanas). El grueso del tiempo es la Fase 6 (migrar los 3 módulos) y la
Fase 3 (definir y probar bien los roles).

## Qué puede avanzarse ahora, sin desarrollador contratado

El diseño de datos (Fase 2), el borrador de roles (Fase 3) y un primer borrador
de `firestore.rules` se pueden armar con Claude/Gemini como punto de partida.
Lo que sí conviene que revise o ejecute alguien con experiencia real en
Firebase antes de ir a producción: las **Security Rules** (la parte más fácil
de dejar mal configurada y exponer todo por error) y el cifrado de campo de
la Fase 4.
