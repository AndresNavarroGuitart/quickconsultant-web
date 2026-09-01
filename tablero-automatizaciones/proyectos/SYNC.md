# Sync del módulo Proyectos con Notion

El módulo **Proyectos** es un espejo de solo lectura del tablero de Notion
**"Status de temas · Equipo NOT A BOT"**
(`https://app.notion.com/p/37d70af0b23b80179bf0d398019c041d`).

Hoy `proyectos-data.js` es un **snapshot** hecho a mano. Para que se actualice
solo, hay que activar el sync automático (una sola vez):

## 1. Crear la integración en Notion

1. Ir a <https://www.notion.so/my-integrations> → **New integration**.
2. Nombre: `Tablero de Operaciones` · Type: **Internal** · Workspace: el de Not a Bot.
3. Capabilities: alcanza con **Read content**.
4. Copiar el **Internal Integration Secret** (empieza con `ntn_...`).

## 2. Compartir la base con la integración

En la base **"Status de temas · Equipo NOT A BOT"** en Notion:
**⋯ (arriba a la derecha) → Connections → Connect to →** elegir `Tablero de Operaciones`.

## 3. Cargar el secret en GitHub

En el repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `NOTION_TOKEN` | el secret `ntn_...` del paso 1 |
| `NOTION_DB_PROYECTOS` | `37d70af0-b23b-8017-9bf0-d398019c041d` (opcional; ya está por defecto en el script) |

## 4. Listo

El workflow [`.github/workflows/sync-proyectos.yml`](../../.github/workflows/sync-proyectos.yml)
corre **cada hora** (y a demanda desde la pestaña **Actions → Sync Proyectos desde
Notion → Run workflow**). Cuando detecta cambios, regenera `proyectos-data.js`,
lo commitea y GitHub Pages se re-publica solo.

Mientras no exista el secret, el workflow corre sin hacer nada (no falla).

## Correrlo a mano localmente

```bash
NOTION_TOKEN=ntn_xxx node tablero-automatizaciones/proyectos/sync-proyectos.mjs
```

## Mapeo de campos (Notion → módulo)

| Notion | Módulo |
|---|---|
| Actividad (title) | `actividad` |
| Cliente (status) | `cliente` |
| Estado (status) | `estado` — columnas del Kanban |
| Etapa (select) | `etapa` |
| Lider Interno (select) | `lider` |
| Producto/Servicio (text) | `producto` |
| Stakeholder (select) | `stakeholder` |
| Inicio / Fin (date) | `inicio` / `fin` |
| — (URL de la página) | `url` — botón "Abrir en Notion" |
