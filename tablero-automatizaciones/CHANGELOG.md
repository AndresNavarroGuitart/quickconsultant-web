# Changelog — Tablero de Operaciones

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).
Versionado: `tablero-vMAJOR.MINOR.PATCH` (tags de git + releases en GitHub).

## [tablero-v1.2.1] — 2026-09-07

### Cambiado

- **Nómina · datos de ejemplo completos**: los 10 colaboradores demo ahora traen
  todos los campos cargados con info ficticia — Documentos (contrato, ID, CV,
  constancia de CBU, títulos), Administración (legajo, centro de costo, banco,
  cuenta, alias, moneda, remuneración, periodicidad, cobertura, notas),
  historial de equipamiento, más movimientos de PTO y seguimientos.
- `?v=` de JS/CSS: **1.2.0 → 1.2.1**.

## [tablero-v1.2.0] — 2026-09-07

### Cambiado

- **Nómina · ficha del colaborador rediseñada como panel** (según mockup del
  cliente). Se reemplazan las 5 solapas por una vista de una sola página con
  tarjetas:
  - **Encabezado**: avatar, nombre, estado, `rol · cliente / proyecto`, botón Editar.
  - **Barra resumen**: dedicación · país · fecha de ingreso · estado del seguimiento.
  - **Datos personales**: ID, mail, teléfono, dirección completa, contacto
    alternativo (nombre · vínculo · teléfono).
  - **Asignación operativa**: cliente, proyecto, punto de contacto del cliente,
    responsable Not a Bot, rol, dedicación.
  - **PTO**: días disponibles calculados (acordados − aprobados del año) +
    movimientos de PTO (ex-Licencias).
  - **Equipamiento** (nuevo): gestión, cliente responsable, entrega, equipo, N.º de
    serie, estado + historial.
  - **Seguimiento de la persona** (ex-Desempeño): tabla fecha/tipo/nota/responsable/
    próximo + alta rápida.
  - **Estado de la relación** (nuevo): semáforo Todo en orden / Requiere atención /
    Riesgo de continuidad, con motivo, próxima acción y oportunidad.
  - **Documentos** y **Administración** quedan como pestañas (Panel · Documentos ·
    Administración).
- **Edición** separada de la vista: `#/empleado/:id` muestra el panel, botón
  **Editar** abre el formulario. Alta con "+ Nuevo colaborador".
- **Campo `Cliente / Proyecto` dividido** en `cliente` + `proyecto`. En el listado
  se muestra "Cliente / Proyecto" combinado.
- Nuevos campos en la interna: `telefono`, `direccionCompleta`, `contactoAlt*`,
  `puntoContactoCliente`, `responsableNotaBot`, `ptoAcordados`, `equipamiento{}`,
  `seguimientos[]`, `relacion{}`. Retirados del alta: tipo de contrato y horas
  semanales (siguen en datos viejos, no se muestran).
- Columna **Seguimiento** del listado: muestra "Al día" / "Pendiente" derivado del
  último seguimiento registrado.
- Fechas del módulo en formato corto `dd/mm/aa`.
- `?v=` de JS/CSS: **1.1.0 → 1.2.0**.

## [tablero-v1.1.0] — 2026-09-07

### Agregado

- **Nómina · ficha**: nueva sección **Asignación** en la solapa Datos personales
  con los campos **Estado** (Activo · Inactivo · Próximo Ingreso · Std By),
  **Cliente / Proyecto**, **Rol**, **Dedicación**, **Inicio** y **Seguimiento**.
  Estado es obligatorio.

### Cambiado

- **Nómina · listado inicial**: las columnas ahora son **Colaborador · Estado ·
  Cliente / Proyecto · Rol · País · Dedicación · Inicio · Seguimiento** (antes:
  documento, mail, tipo de contrato, país, horas). El Estado se muestra como
  chip de color. Toda la info sale de la interna de cada colaborador.
- El buscador de Nómina también matchea por cliente, rol, dedicación,
  seguimiento y estado.
- **Portada · KPI "Total de empleados activos"**: ahora cuenta solo los de
  estado **Activo** (subtítulo "de N en la nómina") en vez del total.
- Datasets de ejemplo de Nómina: clientes/proyectos ficticios (Aurora Retail,
  Nimbus Logística, Faro Educación, etc.).
- `?v=` de JS/CSS: **1.0.5 → 1.1.0**.

## [tablero-v1.0.5] — 2026-09-01

### Cambiado

- Ancho máximo de la página: **1700 → 1500px**.

## [tablero-v1.0.4] — 2026-09-01

### Cambiado

- Ancho máximo de la página: **1200 → 1700px**.

## [tablero-v1.0.3] — 2026-09-01

### Cambiado

- Ancho máximo de la página: **1120 → 1200px** (`.wrap`, topbar y footer en
  `assets/theme.css`). Aplica a todas las vistas.

## [tablero-v1.0.2] — 2026-09-01

### Cambiado

- KPI **"Proyectos activos"** del tablero: el número grande sigue siendo los
  proyectos **En curso**; abajo, en chico, se agrega la cantidad en **Std By**
  (ej. "en curso · 2 en Std By").

## [tablero-v1.0.1] — 2026-09-01

### Corregido

- **Cache del navegador**: las referencias a JS/CSS ahora llevan `?v=1.0.1`, así
  cada release invalida la caché y los clientes ven la última versión sin tener
  que forzar recarga. `proyectos-data.js` queda sin versión (se refresca por la
  caché corta de GitHub Pages y por el sync).
  > Al publicar una nueva versión, subir el número de `?v=` en los `index.html`.

## [tablero-v1.0.0] — 2026-09-01

Primera versión estable, publicada en GitHub Pages y compartible con clientes:
<https://andresnavarroguitart.github.io/quickconsultant-web/tablero-automatizaciones/>

### Agregado

- **Tablero de Operaciones** (front estático, sin backend). Identidad de
  notabotagency.es: DM Serif Display + Alegreya Sans, verde `#03524E`/`#20574E`,
  acentos magenta/terracota. Tema claro/oscuro. Publicado en GitHub Pages.
- Grilla de 5 procesos con buscador, filtros por estado y panel de detalle.
  Eyebrow "Procesos de Gestión".
- 4 KPIs de operación: total de empleados activos, proyectos activos, leads en
  proceso y última actualización (calculados desde los módulos).
- **Módulo Nómina de empleados** (`nomina/`): planilla + ficha con 5 solapas
  (Datos personales · Licencias · Desempeño · Documentos · Administración).
  Alta/edición/baja, persistencia en `localStorage`, 10 empleados de ejemplo.
- **Módulo Pipeline de Clientes** (`pipeline/`): Kanban de 7 etapas con drag &
  drop + vista lista, ficha del lead con seguimiento y registro de actividad,
  barra de filtros, alta/baja. 14 leads de ejemplo.
- **Módulo Proyectos** (`proyectos/`): espejo de solo lectura del tablero de
  Notion "Status de temas · Equipo NOT A BOT". Kanban por estado + lista +
  filtros + ficha con enlace a Notion. Snapshot de 12 proyectos.
- **Sync Notion → Proyectos**: `sync-proyectos.mjs` +
  `.github/workflows/sync-proyectos.yml` (cron horario, sin servidor). Inerte
  hasta cargar el secret `NOTION_TOKEN` (ver `proyectos/SYNC.md`).
- `assets/theme.css` compartido por todas las vistas.

[tablero-v1.2.1]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.2.1
[tablero-v1.2.0]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.2.0
[tablero-v1.1.0]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.1.0
[tablero-v1.0.5]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.5
[tablero-v1.0.4]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.4
[tablero-v1.0.3]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.3
[tablero-v1.0.2]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.2
[tablero-v1.0.1]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.1
[tablero-v1.0.0]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.0
