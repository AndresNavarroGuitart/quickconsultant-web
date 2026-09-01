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

## Módulo: Nómina de empleados (`nomina/`)

Alta y ficha de empleados. La lista es una planilla; cada fila abre la ficha del
empleado, que tiene **5 solapas**:

1. **Datos personales** — foto, nombre, apellido, DNI/RUT/Cédula, pasaporte,
   CUIT/CUIL, dirección legal, barrio, localidad, provincia, país, mail, LinkedIn,
   tipo de contrato y cantidad de horas.
2. **Licencias** — tabla de licencias (tipo, fechas, días calculados, estado) con
   alta y baja; resumen de días tomados y pendientes.
3. **Desempeño** — evaluaciones por período (evaluador, calificación, resumen).
4. **Documentos** — documentos del legajo (nombre, tipo, fecha y archivo opcional
   guardado en el navegador).
5. **Administración** — legajo, fecha de ingreso, centro de costo, datos bancarios,
   moneda, remuneración, periodicidad y cobertura.

En un empleado nuevo, las solapas 2–5 se habilitan recién al guardar los datos
personales.

Los datos se guardan en `localStorage` del navegador (clave `nba-nomina-empleados`),
sin backend. Router por hash: `#/` lista · `#/nuevo` alta · `#/empleado/:id` edición.

La primera vez que se abre el módulo se cargan **10 empleados de ejemplo**
(`empleados-demo.js`). Desde el estado vacío hay un botón para volver a cargarlos.
Al conectar datos reales, borrar `empleados-demo.js` y su `<script>` en `index.html`.

| Archivo | Rol |
|---|---|
| `nomina/index.html` | Estructura + plantillas de lista y formulario |
| `nomina/nomina.css` | Estilos de la lista y la ficha |
| `nomina/nomina.js` | Router, CRUD sobre localStorage, validación del formulario |
| `nomina/empleados-demo.js` | Dataset de ejemplo (10 empleados) |

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
| `proyectos/SYNC.md` | Cómo activar el sync automático |
| `../.github/workflows/sync-proyectos.yml` | Workflow que corre el sync cada hora |

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
