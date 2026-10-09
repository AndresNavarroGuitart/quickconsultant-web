// API de pedidos: guarda todo en Netlify Blobs (no necesita base de datos externa).
// Rutas:
//   GET    /api/config               catálogo y datos de transferencia (público)
//   PUT    /api/config               guardar catálogo (admin)
//   POST   /api/orders               crear pedido (público)
//   GET    /api/orders               listar pedidos (admin)
//   PATCH  /api/orders/:id           { productId?, paid?: bool, delivered?: bool } (admin)
//   DELETE /api/orders/:id           borrar pedido y sus comprobantes (admin)
//   POST   /api/orders/:id/receipts  adjuntar comprobante: cuerpo = archivo, header x-filename (admin)
//   GET    /api/orders/:id/receipts/:rid   ver comprobante (admin)
//   DELETE /api/orders/:id/receipts/:rid   borrar comprobante (admin)
//   POST   /api/login                validar PIN (admin)
// El PIN de admin se configura en Netlify como variable de entorno ADMIN_PIN.
import { getStore } from "@netlify/blobs";

const DEFAULT_CONFIG = {
  team: "",
  campaign: "Campeonato 2026",
  alias: "negro.navarro.82",
  cvu: "0000003100088974020013",
  holder: "Osvaldo Andres Navarro Guitart",
  deadline: "",
  note: "",
  products: [
    { id: "choc", name: "Chocolate BLOCK 38 gramos", detail: "La caja trae 20 unidades", cost: 1600, price: 2500, active: true },
    { id: "snack", name: "Combo Snack", detail: "2 papas saborizadas + 2 maní saborizado", cost: 5000, price: 7000, active: true },
    { id: "picada", name: "Combo Picada", detail: "1 maní sal marina + 2 maní saborizado + 1 pickle mixto + 1 maní sin sal + 1 aceituna verde + 1 ají despuntado + 1 maní japonés saborizado", cost: 13500, price: 19500, active: true },
  ],
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const RECEIPT_MAX_BYTES = 4 * 1024 * 1024;
const RECEIPT_MAX_PER_ORDER = 10;
const RECEIPT_TYPES = /^(image\/(jpeg|png|webp|gif|heic|heif)|application\/pdf)$/;
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
    cvu: clip(c.cvu, 40),
    holder: clip(c.holder, 80),
    deadline: clip(c.deadline, 40),
    note: clip(c.note, 400),
    products,
  };
}

// Cada producto del pedido tiene su propio pago y entrega (son proveedores distintos).
// Los pedidos viejos guardaban el estado a nivel pedido: se copia a cada producto.
function normalize(order) {
  for (const it of order.items) {
    if (!("paidAt" in it)) it.paidAt = order.paidAt ?? null;
    if (!("deliveredAt" in it)) it.deliveredAt = order.deliveredAt ?? null;
  }
  if (!Array.isArray(order.receipts)) order.receipts = [];
  const latest = (field) => order.items.every((it) => it[field]) ? order.items.map((it) => it[field]).sort().at(-1) : null;
  order.paidAt = latest("paidAt");
  order.deliveredAt = latest("deliveredAt");
  return order;
}

export default async (req) => {
  const store = getStore({ name: "pedidos-futbol", consistency: "strong" });
  const url = new URL(req.url);
  const [resource, id, sub, subId] = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
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
        const category = clip(body.category, 40);
        const line = ["Bronce", "Plata"].includes(body.line) ? body.line : "";
        if (!parent || !player) return json({ error: "Completá el nombre del padre/madre y del jugador." }, 400);
        if (!category || !line) return json({ error: "Completá la categoría y la línea del jugador." }, 400);
        if (clip(body.phone, 40).replace(/\D/g, "").length < 8) return json({ error: "Completá un teléfono válido." }, 400);
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
          category, line,
          phone: clip(body.phone, 40),
          notes: clip(body.notes, 300),
          items: items.map((it) => ({ ...it, paidAt: null, deliveredAt: null })),
          totalCost, totalSale, profit: totalSale - totalCost,
          paidAt: null, deliveredAt: null, receipts: [],
        };
        await store.setJSON(`order/${code}`, order);
        return json(order, 201);
      }

      if (!isAdmin()) return json({ error: "No autorizado." }, 401);

      if (method === "GET" && !id) {
        const { blobs } = await store.list({ prefix: "order/" });
        const orders = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean).map(normalize);
        orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return json(orders);
      }

      if (id) {
        const key = `order/${clip(id, 10)}`;
        const order = await store.get(key, { type: "json" });
        if (!order) return json({ error: "Pedido no encontrado." }, 404);
        normalize(order);

        if (sub === "receipts") {
          const rkey = (rid) => `receipt/${order.id}/${rid}`;
          if (method === "POST" && !subId) {
            const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
            if (!RECEIPT_TYPES.test(type)) return json({ error: "Solo se pueden adjuntar imágenes o PDF." }, 400);
            if (order.receipts.length >= RECEIPT_MAX_PER_ORDER) return json({ error: `Máximo ${RECEIPT_MAX_PER_ORDER} comprobantes por pedido.` }, 400);
            const data = await req.arrayBuffer();
            if (!data.byteLength) return json({ error: "El archivo está vacío." }, 400);
            if (data.byteLength > RECEIPT_MAX_BYTES) return json({ error: "El archivo pesa más de 4 MB." }, 400);
            const rid = newCode() + newCode();
            let name = "comprobante";
            try { name = clip(decodeURIComponent(req.headers.get("x-filename") || ""), 120) || name; } catch {}
            await store.set(rkey(rid), data, { metadata: { type } });
            order.receipts.push({ id: rid, name, type, size: data.byteLength, uploadedAt: new Date().toISOString() });
            await store.setJSON(key, order);
            return json(order, 201);
          }
          const rec = order.receipts.find((r) => r.id === subId);
          if (!rec) return json({ error: "Comprobante no encontrado." }, 404);
          if (method === "GET") {
            const blob = await store.get(rkey(rec.id), { type: "arrayBuffer" });
            if (!blob) return json({ error: "Comprobante no encontrado." }, 404);
            return new Response(blob, { headers: { "content-type": rec.type, "cache-control": "private, no-store" } });
          }
          if (method === "DELETE") {
            await store.delete(rkey(rec.id));
            order.receipts = order.receipts.filter((r) => r.id !== rec.id);
            await store.setJSON(key, order);
            return json(order);
          }
          return json({ error: "Ruta no encontrada." }, 404);
        }

        if (method === "DELETE") {
          await Promise.all(order.receipts.map((r) => store.delete(`receipt/${order.id}/${r.id}`)));
          await store.delete(key);
          return json({ ok: true });
        }
        if (method === "PATCH") {
          // { productId?, paid?, delivered? } — sin productId aplica a todos los productos del pedido.
          const body = await readBody();
          const now = new Date().toISOString();
          const targets = body.productId ? order.items.filter((it) => it.productId === body.productId) : order.items;
          if (!targets.length) return json({ error: "Ese producto no está en el pedido." }, 404);
          for (const it of targets) {
            if ("paid" in body) it.paidAt = body.paid ? (it.paidAt ?? now) : null;
            if ("delivered" in body) it.deliveredAt = body.delivered ? (it.deliveredAt ?? now) : null;
          }
          normalize(order);
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
