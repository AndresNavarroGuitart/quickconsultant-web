# Changelog — Tablero de Operaciones

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).
Versionado: `tablero-vMAJOR.MINOR.PATCH` (tags de git + releases en GitHub).

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

[tablero-v1.0.3]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.3
[tablero-v1.0.2]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.2
[tablero-v1.0.1]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.1
[tablero-v1.0.0]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.0
