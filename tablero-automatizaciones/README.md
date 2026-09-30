# Tablero de Operaciones — Not a Bot Agency

Panel de control de la operación de la agencia: empleados, proyectos y pipeline
de clientes, más el estado de cada proceso de gestión.

**Publicado:** <https://andresnavarroguitart.github.io/quickconsultant-web/tablero-automatizaciones/>
· **Versiones:** ver [`CHANGELOG.md`](CHANGELOG.md) y los
[releases](https://github.com/AndresNavarroGuitart/quickconsultant-web/releases)
con tag `tablero-v*`.

Front estático (HTML + CSS + JS, sin build) con la identidad visual de
[notabotagency.es](https://notabotagency.es): tipografías **DM Serif Display** /
**Alegreya Sans**, verde `#03524E`/`#20574E` y acentos magenta `#CC3366` y
terracota `#C84E1E`. Soporta tema claro/oscuro.

## Estructura

| Archivo | Rol |
|---|---|
| `index.html` | Tablero: estructura de la página |
| `styles.css` | Estilos propios del tablero |
| `app.js` | Render de KPIs, grilla, filtros y panel de detalle |
| `data.js` | **Fuente de datos** del tablero (hoy datos de ejemplo) |
| `assets/theme.css` | Tokens de marca + shell (topbar, botones, footer) compartido por todas las vistas |
| `assets/logo.svg` | Logo Not a Bot Agency (vectorial) |
| `nomina/` | **Módulo Nómina de empleados** (ver abajo) |
| `pipeline/` | **Módulo Pipeline de Clientes** (ver abajo) |
| `proyectos/` | **Módulo Proyectos** — espejo del tablero de Notion (ver abajo) |
| `time-summary/` | **Módulo Time Summary** — carga de horas para liquidar el pago (ver abajo) |
| `alta-colaborador/` | **Formulario de alta de colaborador** — independiente del tablero (ver abajo) |
| `PLAN-PRODUCCION.md` | Roadmap para pasar a producción (login, base de datos, roles, cifrado, logging) |

## Módulo: Nómina de empleados (`nomina/`)

Listado de colaboradores (planilla) + ficha en **formato panel** de una sola página.

**Listado** — columnas: Colaborador · Estado (Activo / Inactivo / Próximo Ingreso /
Std By) · Cliente / Proyecto · Rol · País · Dedicación · Inicio · Seguimiento
(derivado). Buscador por nombre, cliente, rol, estado.

**Ficha** (`#/empleado/:id`) — panel con encabezado (avatar, estado, `rol · cliente /
proyecto`, botón Editar), barra resumen (dedicación · país · ingreso · seguimiento) y
tarjetas: **Datos personales**, **Asignación operativa**, **PTO** (días disponibles
calculados + movimientos), **Equipamiento** (+ historial), **Seguimiento de la
persona**, **Estado de la relación** (semáforo Todo en orden / Requiere atención /
Riesgo de continuidad). **Documentos** y **Administración** son pestañas.

**Edición** (`#/empleado/:id/editar`) separada de la vista; alta en `#/nuevo`.

Persistencia en `localStorage` (clave `nba-nomina-empleados`), sin backend. Router por
hash: `#/` · `#/nuevo` · `#/empleado/:id` · `#/empleado/:id/{doc,adm,editar}`.

La primera vez se cargan **10 colaboradores de ejemplo** (`empleados-demo.js`, datos
ficticios). Desde el estado vacío hay un botón para recargarlos. Al conectar datos
reales, borrar `empleados-demo.js` y su `<script>` en `index.html`.

> Hay un Google Form/Sheet de RRHH que podría alimentar esto automáticamente, pero
> **no está conectado a propósito** — ver [`nomina/EMPLEADOS-SYNC.md`](nomina/EMPLEADOS-SYNC.md).

| Archivo | Rol |
|---|---|
| `nomina/index.html` | Estructura + plantilla del listado (`tpl-lista`) |
| `nomina/nomina.css` | Estilos del listado y del panel |
| `nomina/nomina.js` | Router, vistas (listado / ficha / edición), CRUD sobre localStorage |
| `nomina/empleados-demo.js` | Dataset de ejemplo (10 colaboradores) |

## Módulo: Pipeline de Clientes (`pipeline/`)

Seguimiento de leads. Dos vistas del mismo dato:

- **Kanban** — columnas por etapa (Nuevo · Contactado · Calificado · Propuesta
  enviada · Negociación · Ganado · Perdido). Se arrastra la tarjeta entre columnas
  para avanzar la etapa.
- **Lista** — planilla ordenada por próxima acción, con las vencidas resaltadas.

**Filtros** (barra sobre las dos vistas): búsqueda por nombre/empresa/mail, y
selects por etapa, origen, servicio y responsable, más un toggle "solo vencidos".
Botón "Limpiar" cuando hay algún filtro activo.

**Ficha del lead** (drawer): datos editables (contacto, empresa, mail, teléfono,
origen, servicio, responsable) · **Seguimiento** (próxima acción + fecha) ·
**Actividad** (historial con fecha y tipo + alta). Alta de lead nuevo y baja desde
la misma ficha. La probabilidad se deriva de la etapa (informativa, no editable).

KPIs calculados: leads activos, seguimientos vencidos, leads sin próxima acción,
tasa de conversión.

Persistencia en `localStorage` (`nba-pipeline-leads`), sin backend. 14 leads de
ejemplo en `leads-demo.js` (se siembran al abrir). Al conectar el CRM/Notion,
borrar `leads-demo.js` y su `<script>` en `index.html`.

| Archivo | Rol |
|---|---|
| `pipeline/index.html` | Estructura (KPIs, toolbar, board, lista, drawer) |
| `pipeline/pipeline.css` | Estilos del Kanban, la lista y la ficha |
| `pipeline/pipeline.js` | Estado, drag & drop, KPIs, ficha y alta |
| `pipeline/leads-demo.js` | Dataset de ejemplo (14 leads) |

## Módulo: Proyectos (`proyectos/`)

**Espejo de solo lectura** del tablero de Notion "Status de temas · Equipo NOT A
BOT". Kanban por **Estado** (Sin Iniciar · En curso · Std By · Finalizado) + vista
Lista, con filtros por cliente, etapa y líder, y búsqueda. Cada proyecto abre una
ficha con sus datos y un botón **Abrir en Notion**. No se edita desde acá: los
cambios se hacen en Notion.

Los datos están en `proyectos-data.js`. Hoy es un **snapshot**; para el sync
automático (GitHub Actions, sin servidor) seguir [`SYNC.md`](proyectos/SYNC.md).
El KPI "Proyectos activos" del tablero principal cuenta los "En curso" de este
módulo.

| Archivo | Rol |
|---|---|
| `proyectos/index.html` | Estructura (banner de sync, KPIs, toolbar, board, lista, drawer) |
| `proyectos/proyectos.css` | Estilos del Kanban, la lista y la ficha |
| `proyectos/proyectos.js` | Render, filtros y ficha (solo lectura) |
| `proyectos/proyectos-data.js` | Datos (snapshot de Notion o generado por el sync) |
| `proyectos/sync-proyectos.mjs` | Script que baja el tablero de Notion y regenera el `.js` |
| `proyectos/SYNC.md` | Cómo activar el sync automático (workflow de GitHub Actions) |

> El workflow de sync **no** corre hoy (falta el secret `NOTION_TOKEN`): mientras el
> repo sea público, no debe activarse (publicaría datos de Notion). Ver `proyectos/SYNC.md`.

## Módulo: Time Summary (`time-summary/`)

Carga de horas trabajadas por colaborador durante el mes, para liquidar el pago.
Inspirado en Clockify. Cuatro vistas:

- **Rastreador** — barra superior con descripción, proyecto, etiquetas y un
  cronómetro (Inicio/Detener); también se puede cargar una entrada manual
  (fecha + inicio/fin, o directamente la cantidad de horas). El listado agrupa
  las entradas por semana y por día, con el total de cada una.
- **Planilla** — grilla semanal (filas = proyecto, columnas = días) con celdas
  editables. Botones para agregar una fila de proyecto, copiar las horas de la
  semana pasada, o guardar la lista de proyectos como plantilla para las
  próximas semanas.
- **Resumen mensual** — total de horas por colaborador en el mes elegido
  (suma del Rastreador + la Planilla), con un botón para enviarlo a una
  planilla de RRHH (no queda guardado en este sitio).
- **Administración** — vista para RRHH: todos los colaboradores **Activos**,
  con las horas cargadas en el período (semana o mes, con navegación) y un
  estado "✓ Cargó" / "⚠ Sin cargar" — con un filtro para ver solo a quienes
  falta. Usa la misma info que ya ve cualquiera en "Resumen mensual"; no agrega
  una categoría de dato más sensible.

El colaborador se elige de un desplegable poblado con los empleados **Activos**
de Nómina; el proyecto por defecto sale del `cliente`/`proyecto` de su ficha.

Persistencia en `localStorage` (`nba-timesummary-*`), sin backend. A diferencia
de `alta-colaborador/`, **sí** forma parte del tablero (está listado en
`data.js` y tiene el link "‹ Tablero").

**Estado:** el envío del resumen mensual todavía no está conectado a un Google
Form real — ver [`time-summary/SETUP.md`](time-summary/SETUP.md). Mientras
tanto, avisa explícitamente que no está conectado en vez de simular un envío.

Como no hay login, cualquiera puede cargarle horas a cualquier colaborador del
desplegable — no es un problema de datos personales (acá no hay DNI ni datos
bancarios) pero sí de control de integridad para un proceso que define un pago;
se resuelve con el login real de `PLAN-PRODUCCION.md`.

| Archivo | Rol |
|---|---|
| `time-summary/index.html` | Estructura + plantillas de las 4 vistas |
| `time-summary/time-summary.css` | Estilos propios |
| `time-summary/time-summary.js` | Router, cronómetro, planilla, resumen mensual y envío (config pendiente) |
| `time-summary/time-entries-demo.js` | Dataset de ejemplo (ficticio) |
| `time-summary/SETUP.md` | Cómo conectar el envío del resumen mensual |

## Formulario: Alta de colaborador (`alta-colaborador/`)

Formulario para que un colaborador/contractor nuevo cargue sus datos (personales,
contacto, wallet USDC) y documentación (DNI frente/dorso, pasaporte, CV en PDF) para el
contrato y el NDA. **Es una página aparte, no forma parte del Tablero de
Operaciones** — no tiene navegación hacia el tablero ni viceversa, y no aparece
listada como proceso en `data.js`. Comparte solo la identidad visual
(`assets/theme.css`, tipografías, logo).

No usa `localStorage` ni escribe nada en este repo: los campos de texto se
envían a un Google Form/Sheet privado de Not a Bot, y la documentación se sube
aparte en un Google Form nativo (los adjuntos de Google Forms exigen login con
Google, no se pueden recibir desde una página externa). El popup de
consentimiento de datos personales se muestra recién cuando están completos
todos los campos obligatorios.

**Estado:** el diseño y la validación están completos, pero **el envío real
todavía no está conectado** (faltan la URL del Google Form y el texto legal
definitivo de Not a Bot) — ver [`alta-colaborador/SETUP.md`](alta-colaborador/SETUP.md)
para dejarlo operativo.

| Archivo | Rol |
|---|---|
| `alta-colaborador/index.html` | Estructura del formulario + popups de consentimiento y de documentación |
| `alta-colaborador/alta-colaborador.css` | Estilos propios |
| `alta-colaborador/alta-colaborador.js` | Validación, popup de consentimiento, envío (config pendiente) |
| `alta-colaborador/SETUP.md` | Cómo conectarlo a un Google Form real |

## Cómo agregar o editar un proceso

Editar el array `procesos` en [`data.js`](data.js). Cada entrada:

```js
{
  id: "slug-unico",
  nombre: "Nombre visible",
  categoria: "comercial",       // clave de TABLERO.categorias
  estado: "operativo",          // operativo | atencion | detenido
  descripcion: "Qué hace el proceso.",
  frecuencia: "Diaria · 07:00",
  ultimaEjecucion: "2026-08-28T07:03:00-03:00",
  duracionMedia: "≈ 3 min",
  exito7d: 98,                  // %
  ejecuciones7d: 7,
  responsable: "Nombre",
  enlace: "../alguna-app/",     // o null
  corridas: [
    { fecha: "2026-08-28T07:03:00-03:00", estado: "ok", detalle: "..." }
    // estado: ok | aviso | error
  ]
}
```

Los KPIs de arriba se recalculan solos a partir de esa lista.

## Conectar a datos reales

Reemplazar el contenido de `data.js` por una llamada al backend antes de que
corra `app.js`, manteniendo la misma forma de objeto en `window.TABLERO`.

## Desarrollo local

Servir la carpeta con cualquier servidor estático. Desde la raíz del repo:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

y abrir `http://localhost:3005/tablero-automatizaciones/index.html`
(el módulo Nómina queda en `.../tablero-automatizaciones/nomina/index.html`).
