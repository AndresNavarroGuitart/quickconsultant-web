# Changelog — Tablero de Operaciones

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).
Versionado: `tablero-vMAJOR.MINOR.PATCH` (tags de git + releases en GitHub).

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

[tablero-v1.0.0]: https://github.com/AndresNavarroGuitart/quickconsultant-web/releases/tag/tablero-v1.0.0
