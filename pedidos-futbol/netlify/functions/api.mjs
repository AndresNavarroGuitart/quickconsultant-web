// API de pedidos: guarda todo en Netlify Blobs (no necesita base de datos externa).
// Rutas:
//   GET    /api/config               catálogo y datos de transferencia (público)
//   PUT    /api/config               guardar catálogo (admin)
//   POST   /api/orders               crear pedido (público)
//   GET    /api/orders               listar pedidos (admin)
//   PATCH  /api/orders/:id           { paid?: bool, delivered?: bool } (admin)
//   DELETE /api/orders/:id           borrar pedido (admin)
//   POST   /api/login                validar PIN (admin)
// El PIN de admin se configura en Netlify como variable de entorno ADMIN_PIN.
import { getStore } from "@netlify/blobs";

const DEFAULT_CONFIG = {
  team: "Mi equipo",
  campaign: "Campeonato 2026",
  alias: "",
  holder: "",
  deadline: "",
  note: "Los productos de esta lista son de ejemplo. Editalos desde el panel de administración.",
  products: [
    { id: "alf", name: "Alfajores de maicena", detail: "Caja x 12", cost: 4500, price: 7000, active: true },
    { id: "pasta", name: "Pastafrola grande", detail: "De membrillo, 28 cm", cost: 6000, price: 9000, active: true },
    { id: "pizza", name: "Pizzas congeladas", detail: "Pack x 2, muzzarella", cost: 5500, price: 8000, active: true },
    { id: "emp", name: "Empanadas congeladas", detail: "Docena, carne o JyQ", cost: 9000, price: 13500, active: true },
    { id: "bud", name: "Budín de limón", detail: "500 g", cost: 3500, price: 5500, active: true },
    { id: "rifa", name: "Bono rifa", detail: "Sorteo el día de la final", cost: 1000, price: 2000, active: true },
  ],
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const num = (v) => Math.max(0, Math.round(Number(v) || 0));
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

function sanitizeConfig(c) {
  const products = (Array.isArray(c.products) ? c.products : []).slice(0, 100).map((p) => ({
    id: clip(p.id, 40) || newCode().toLowerCase(),
    name: clip(p.name, 80),
    detail: clip(p.detail, 120),
    cost: num(p.cost),
    price: num(p.price),
    active: p.active !== false,
  })).filter((p) => p.name);
  return {
    team: clip(c.team, 80),
    campaign: clip(c.campaign, 80),
    alias: clip(c.alias, 80),
    holder: clip(c.holder, 80),
    deadline: clip(c.deadline, 40),
    note: clip(c.note, 400),
    products,
  };
}

export default async (req) => {
  const store = getStore({ name: "pedidos-futbol", consistency: "strong" });
  const url = new URL(req.url);
  const [resource, id] = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;

  const pin = (globalThis.Netlify?.env?.get("ADMIN_PIN") ?? process.env.ADMIN_PIN ?? "").trim();
  const isAdmin = () => pin !== "" && req.headers.get("x-admin-pin") === pin;
  const readBody = async () => { try { return await req.json(); } catch { return {}; } };
  const getConfig = async () => (await store.get("config", { type: "json" })) ?? DEFAULT_CONFIG;

  try {
    if (resource === "login" && method === "POST") {
      if (!pin) return json({ error: "Falta configurar la variable ADMIN_PIN en Netlify." }, 500);
      const body = await readBody();
      return String(body.pin ?? "") === pin ? json({ ok: true }) : json({ error: "PIN incorrecto." }, 401);
    }

    if (resource === "config") {
      if (method === "GET") return json(await getConfig());
      if (method === "PUT") {
        if (!isAdmin()) return json({ error: "No autorizado." }, 401);
        const cfg = sanitizeConfig(await readBody());
        await store.setJSON("config", cfg);
        return json(cfg);
      }
    }

    if (resource === "orders") {
      if (method === "POST" && !id) {
        const body = await readBody();
        const parent = clip(body.parent, 80);
        const player = clip(body.player, 80);
        if (!parent || !player) return json({ error: "Completá el nombre del padre/madre y del jugador." }, 400);
        const cfg = await getConfig();
        const byId = new Map(cfg.products.filter((p) => p.active).map((p) => [p.id, p]));
        // Los precios se toman del catálogo del servidor, no de lo que manda el navegador.
        const items = (Array.isArray(body.items) ? body.items : [])
          .map((it) => ({ p: byId.get(it.productId), qty: Math.min(500, num(it.qty)) }))
          .filter((it) => it.p && it.qty > 0)
          .map(({ p, qty }) => ({ productId: p.id, name: p.name, detail: p.detail, qty, cost: p.cost, price: p.price }));
        if (!items.length) return json({ error: "El pedido no tiene productos." }, 400);
        const totalCost = items.reduce((s, it) => s + it.qty * it.cost, 0);
        const totalSale = items.reduce((s, it) => s + it.qty * it.price, 0);
        let code = newCode();
        while (await store.get(`order/${code}`)) code = newCode();
        const order = {
          id: code,
          createdAt: new Date().toISOString(),
          parent, player,
          phone: clip(body.phone, 40),
          notes: clip(body.notes, 300),
          items, totalCost, totalSale, profit: totalSale - totalCost,
          paidAt: null, deliveredAt: null,
        };
        await store.setJSON(`order/${code}`, order);
        return json(order, 201);
      }

      if (!isAdmin()) return json({ error: "No autorizado." }, 401);

      if (method === "GET" && !id) {
        const { blobs } = await store.list({ prefix: "order/" });
        const orders = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
        orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return json(orders);
      }

      if (id) {
        const key = `order/${clip(id, 10)}`;
        const order = await store.get(key, { type: "json" });
        if (!order) return json({ error: "Pedido no encontrado." }, 404);
        if (method === "DELETE") { await store.delete(key); return json({ ok: true }); }
        if (method === "PATCH") {
          const body = await readBody();
          const now = new Date().toISOString();
          if ("paid" in body) order.paidAt = body.paid ? (order.paidAt ?? now) : null;
          if ("delivered" in body) order.deliveredAt = body.delivered ? (order.deliveredAt ?? now) : null;
          await store.setJSON(key, order);
          return json(order);
        }
      }
    }

    return json({ error: "Ruta no encontrada." }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: "Error del servidor. Probá de nuevo en un momento." }, 500);
  }
};

export const config = { path: "/api/*" };
