/* Sync: Notion "Status de temas · Equipo NOT A BOT"  ->  proyectos-data.js
 *
 * Uso local:   NOTION_TOKEN=ntn_xxx node sync-proyectos.mjs
 * En CI:       lo corre .github/workflows/sync-proyectos.yml
 *
 * Sin NOTION_TOKEN el script termina sin hacer nada (exit 0), así el workflow
 * no falla antes de que esté configurada la integración.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_DB_PROYECTOS || "37d70af0-b23b-8017-9bf0-d398019c041d";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "proyectos-data.js");
const NOTION_VERSION = "2022-06-28";

if (!TOKEN) {
  console.log("NOTION_TOKEN no configurado — no hay nada que sincronizar. Saliendo.");
  process.exit(0);
}

const txt = (rt) => (rt && rt[0] ? rt[0].plain_text : "");
const sel = (p) => (p && p.select ? p.select.name : "");
const stat = (p) => (p && p.status ? p.status.name : "");
const date = (p) => (p && p.date ? p.date.start : "");

async function queryAll() {
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    });
    if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
    const data = await res.json();
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return rows;
}

function mapRow(page) {
  const p = page.properties;
  return {
    id: "n" + page.id.replace(/-/g, "").slice(0, 8),
    actividad: txt(p["Actividad"] && p["Actividad"].title),
    cliente: stat(p["Cliente"]),
    estado: stat(p["Estado"]),
    etapa: sel(p["Etapa"]),
    lider: sel(p["Lider Interno"]),
    producto: txt(p["Producto/Servicio"] && p["Producto/Servicio"].rich_text),
    stakeholder: sel(p["Stakeholder"]),
    inicio: date(p["Inicio"]),
    fin: date(p["Fin"]),
    url: page.url,
  };
}

function serialize(proyectos) {
  const line = (o) =>
    "    { " +
    ["id", "actividad", "cliente", "estado", "etapa", "lider", "producto", "stakeholder", "inicio", "fin", "url"]
      .map((k) => `${k}: ${JSON.stringify(o[k] || "")}`)
      .join(", ") +
    " },";
  return (
    `/* Proyectos — espejo del tablero de Notion "Status de temas · Equipo NOT A BOT".\n` +
    `   Generado automáticamente por sync-proyectos.mjs. No editar a mano. */\n` +
    `window.PROYECTOS_DATA = {\n` +
    `  fuente: "Notion — Status de temas · Equipo NOT A BOT",\n` +
    `  notionUrl: "https://app.notion.com/p/37d70af0b23b80179bf0d398019c041d",\n` +
    `  sincronizado: ${JSON.stringify(new Date().toISOString())},\n` +
    `  proyectos: [\n${proyectos.map(line).join("\n")}\n  ],\n};\n`
  );
}

const proyectos = (await queryAll())
  .map(mapRow)
  .filter((p) => p.actividad)
  .sort((a, b) => (b.inicio || "").localeCompare(a.inicio || ""));

const nuevo = serialize(proyectos);
let previo = "";
try { previo = readFileSync(OUT, "utf8"); } catch {}

// Comparar ignorando la línea "sincronizado" (que siempre cambia)
const strip = (s) => s.replace(/^\s*sincronizado:.*$/m, "");
if (strip(previo) === strip(nuevo)) {
  console.log(`Sin cambios (${proyectos.length} proyectos).`);
  process.exit(0);
}

writeFileSync(OUT, nuevo);
console.log(`Actualizado proyectos-data.js con ${proyectos.length} proyectos.`);
