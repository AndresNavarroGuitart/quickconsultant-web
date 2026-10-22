# Pedidos del Equipo: sistema de pedidos para recaudar fondos

App web para que las familias de un equipo de fútbol infantil hagan pedidos de productos
(chocolates, combos de snacks) y así recaudar fondos para un campeonato. El organizador
tiene un panel para ver todos los pedidos, saber cuánto comprar a cada proveedor, registrar
pagos y entregas por producto, adjuntar comprobantes y editar pedidos.

- **Sitio publicado:** https://pedidosfutbol.netlify.app (padres) · https://pedidosfutbol.netlify.app/#admin (organizador)
- **Código:** repo `AndresNavarroGuitart/quickconsultant-web`, rama `claude/gracious-mayer-w1vjfe`, carpeta `pedidos-futbol/`
- **Hosting:** Netlify (cuenta personal), con deploy automático en cada push a esa rama
- **Pie de página:** "Todos los derechos reservados - Quick Consultant", con link a https://quickconsultant.com.ar/productos

---

## 1. Cómo funciona el negocio

- La familia **compra al precio de costo** (eso es lo que transfiere al organizador) y **revende al precio sugerido**. La diferencia es su ganancia para el equipo.
- El organizador junta todos los pedidos, **compra a cada proveedor** el total por producto y después **entrega** a cada familia.
- Hay **proveedores distintos** por producto, así que el pago y la entrega se registran **por producto** dentro de cada pedido, no por pedido entero.

### Catálogo inicial

Se edita desde el panel. Los precios están en pesos argentinos, sin decimales.

| id | Producto | Detalle | Costo | Venta | Ganancia c/u |
|---|---|---|---|---|---|
| `choc` | Chocolate BLOCK 38 gramos | La caja trae 20 unidades | $ 1.600 | $ 2.500 | $ 900 |
| `snack` | Combo Snack | 2 papas saborizadas + 2 maní saborizado | $ 5.000 | $ 7.000 | $ 2.000 |
| `picada` | Combo Picada | 1 maní sal marina + 2 maní saborizado + 1 pickle mixto + 1 maní sin sal + 1 aceituna verde + 1 ají despuntado + 1 maní japonés saborizado | $ 13.500 | $ 19.500 | $ 6.000 |

> En producción el organizador renombró el chocolate a "CAJA BLOCK x 20 unidades" desde el panel. El catálogo vigente vive en la base de datos (Netlify Blobs), no en el código.

### Datos de transferencia (configurables en el panel)

- Alias: `negro.navarro.82`
- CVU: `0000003100088974020013`
- Titular: Osvaldo Andres Navarro Guitart
- Campaña: "Campeonato 2026" (el nombre del equipo es opcional y hoy está vacío)

---

## 2. Vista de los padres (`/`)

Un flujo de 3 pasos con un indicador de pasos arriba. Un borrador se guarda en el navegador (localStorage), así que si cierran la página no pierden lo cargado.

### Paso 1: Tus datos

Todos los campos son **obligatorios menos Comentario**:

| Campo | Tipo | Validación |
|---|---|---|
| Nombre del padre o madre | texto | requerido |
| Nombre del jugador | texto | requerido |
| Categoría | texto (ej. "2015") | requerido |
| Línea | desplegable: **Bronce** / **Plata** | requerido |
| Teléfono / WhatsApp | teléfono | requerido, al menos 8 dígitos |
| Comentario | texto largo | opcional |

Si falta algo, muestra un mensaje que lista lo que falta ("Falta completar la categoría, la línea y un teléfono válido.") y pone el foco en el primer campo vacío.

### Paso 2: Productos

- Una grilla con cada producto: nombre, detalle, costo, venta y "Ganás $X c/u", con un stepper − / + para la cantidad (0 a 500).
- Al final de la lista va un recuadro **"Tu pedido"**, estilo carrito de compras: cada producto elegido con "cantidad × costo = subtotal", "Si vendés todo, ganás $X", el **TOTAL A TRANSFERIR** destacado, el alias y el titular, y el botón "Revisar y cerrar pedido".
- Una barra fija abajo siempre muestra **Me transferís $X** y **Tu ganancia $Y**, con el mismo botón.

### Paso 3: Confirmar

- Un cuadro modal con el resumen completo del pedido. Botones: "Volver a editar" y "Confirmar y cerrar pedido".
- Al confirmar, el pedido se guarda en el servidor y recibe un **código de 5 caracteres** (ej. `#K7P2Q`, sin caracteres ambiguos como 0/O o 1/I).

### Pantalla final

- El número de pedido, en grande.
- Los datos de transferencia: **alias y CVU, cada uno con su botón Copiar**, y el titular.
- El comprobante con los datos de la familia, los productos y tres totales: A transferir, Vendiendo todo y Ganancia.
- **Descargar comprobante:** genera un PNG dibujado en un canvas, sin librerías, con el encabezado verde, los datos, la tabla de productos, los totales y los datos de transferencia.
- **Copiar resumen para WhatsApp:** texto plano con el pedido, los totales, el alias, el CVU y el titular.
- **Hacer otro pedido.**

Los padres **no pueden editar** un pedido una vez cerrado.

---

## 3. Panel del organizador (`/#admin`)

Se entra con un PIN (variable de entorno `ADMIN_PIN` en Netlify). El PIN se guarda en sessionStorage mientras la pestaña está abierta.

### Indicadores arriba

- **Pedidos:** la cantidad de pedidos y la cantidad de jugadores distintos.
- **A recaudar:** la suma de lo que todos tienen que transferir (destacado en verde).
- **Cobrado:** la suma de los productos marcados como pagados, y cuántas familias pagaron todo.
- **Ganancia de las familias:** la suma si venden todo.
- **Entregados:** pedidos completos sobre el total.

### Solapa "Compras"

- La lista de compras **unificada por producto**: cantidad a comprar, en cuántos pedidos aparece, costo total y venta total, con una fila de total.
- Filtro **Todos / Solo pagados**. Solo pagados cuenta producto por producto.
- Exportación a CSV.

### Solapa "Pedidos"

Una tabla con: código (+ etiqueta "Editado" con fecha), fecha, padre/madre en negrita, y jugador · categoría · línea · teléfono en gris, productos, monto a transferir, estado de pago, comprobantes y acciones.

- **Estado de pago:** "Pagado (fecha)", "Pagó 1 de 2" o "Sin pagar". Al tocarlo se marcan o desmarcan todos los productos del pedido.
- **Comprobantes:** ver la sección 3.1.
- **Editar:** ver la sección 3.2.
- **Borrar:** pide confirmar en línea ("¿Borrar? Sí / No") y borra también los comprobantes.
- Un buscador por nombre, número de pedido, categoría o línea.
- CSV con: Pedido, Fecha, Padre/madre, Jugador, Categoría, Línea, Teléfono, Productos, A transferir, Ganancia, Pagado, Entregado y Comentario.

### Solapa "Entregas" (planilla de entregas)

- Una tarjeta por pedido. Arriba: **el padre o madre en negrita**, y en gris el jugador · categoría · línea · #código · teléfono. A la derecha: los botones Editar y comprobantes, y las píldoras **Pagado n/N** y **Entregado n/N**.
- **Una fila por producto**: "10× Combo Snack · $ 50.000", con dos casillas independientes, **Pagado** y **Entregado**. Cada una guarda su **fecha y hora** al tildarse y la borra al destildarse.
- Filtros: **producto** (para repartir lo de un proveedor), **Pendientes / Entregados / Todos**, y un buscador.
- Orden: primero los pendientes, después alfabético por padre o madre.
- Un pedido cuenta como "entregado" cuando están entregados todos sus productos (o todos los del producto filtrado).
- CSV con **una fila por producto**: Pedido, Padre/madre, Jugador, Categoría, Línea, Teléfono, Producto, Cantidad, Monto, Pagado y Entregado.

### Solapa "Productos y datos"

- **Datos de la campaña:** nombre del equipo (opcional), campaña, alias, CVU/CBU, titular, y el aviso para los padres (texto que aparece arriba de la lista de productos; si está vacío no se muestra).
- **Productos:** una tabla editable con nombre, detalle, costo, venta, ganancia calculada, visible (sí/no) y quitar. También "+ Agregar producto".
- Los pedidos ya hechos **conservan el precio** que tenían al momento de pedir.

### 3.1 Comprobantes de pago

- Botón **"+ Adjuntar"** por pedido. Acepta varios archivos a la vez, fotos o PDF.
- Las fotos se **achican en el navegador** antes de subir (máximo 1800 px, JPEG al 82 %). Los PDF se suben tal cual.
- Límites: **4 MB por archivo** y **10 comprobantes por pedido**.
- Cada comprobante aparece como un botón ("Foto 1", "PDF 2"…) que abre un **visor** con el nombre, la fecha de carga, Anterior/Siguiente, "Abrir en otra pestaña" y Eliminar (pide tocar dos veces).
- En la planilla de entregas se ve como "📎 N comprobantes".
- Solo se pueden ver con el PIN de administrador.

### 3.2 Edición de pedidos (solo admin)

- Un modal con: padre/madre, jugador, categoría, línea, teléfono, comentario y la lista de productos con stepper (los del pedido más el resto del catálogo activo).
- Muestra el nuevo total a transferir en vivo.
- Reglas:
  - Los productos que **ya estaban** mantienen su **precio original** y su estado de **pagado/entregado** aunque cambie la cantidad.
  - Los productos **agregados** toman el **precio actual** del catálogo y arrancan sin pagar y sin entregar.
  - Cantidad 0 = se saca del pedido. No se puede guardar un pedido vacío (para anularlo, Borrar).
  - Al guardar se registra `editedAt`. Los comprobantes no se tocan.

---

## 4. Arquitectura técnica

```
pedidos-futbol/
├── netlify.toml                 # publish = "public", functions = "netlify/functions", Node 22
├── package.json                 # dependencia: @netlify/blobs 10.7.12
├── public/index.html            # toda la web (HTML + CSS + JS vanilla, sin build)
└── netlify/functions/api.mjs    # API (Netlify Functions v2) en /api/*
```

- **Frontend:** un solo HTML con JS vanilla, sin frameworks ni build. Usa ruteo por hash: `/` para padres y `#admin` para el panel.
- **Backend:** una Netlify Function (`export const config = { path: "/api/*" }`).
- **Base de datos:** **Netlify Blobs**, store `pedidos-futbol`, con consistencia `strong`. No usa base de datos externa.
- **Modo demo:** si `/api/config` no responde con JSON, la web pasa a "Vista previa · datos de ejemplo" y usa localStorage con pedidos de ejemplo (PIN de demo: `1234`). Sirve para mostrar la app sin servidor.
- **Fuentes:** Google Fonts, "Big Shoulders Display" (títulos y números) y "Figtree" (texto).
- **Diseño:** una banda verde de cancha con líneas de tiza; tema claro y oscuro con tokens CSS; adaptado a celular.

### Claves en Netlify Blobs

| Clave | Contenido |
|---|---|
| `config` | JSON con la configuración y el catálogo |
| `order/<CODIGO>` | JSON del pedido |
| `receipt/<CODIGO>/<rid>` | binario del comprobante (metadata: `type`) |

### Modelo de datos

```jsonc
// config
{
  "team": "", "campaign": "Campeonato 2026",
  "alias": "negro.navarro.82", "cvu": "0000003100088974020013", "holder": "Osvaldo Andres Navarro Guitart",
  "note": "",
  "products": [{ "id": "snack", "name": "Combo Snack", "detail": "...", "cost": 5000, "price": 7000, "active": true }]
}

// order/<CODIGO>
{
  "id": "AJTXZ",
  "createdAt": "2026-10-09T15:00:00.000Z",
  "editedAt": null,
  "parent": "Lorena", "player": "Ludovico Carreras",
  "category": "2015", "line": "Plata",            // line: "Bronce" | "Plata"
  "phone": "3513908941", "notes": "",
  "items": [
    { "productId": "snack", "name": "Combo Snack", "detail": "...", "qty": 10,
      "cost": 5000, "price": 7000,                // precio congelado al momento del pedido
      "paidAt": null, "deliveredAt": null }       // estado por producto (ISO o null)
  ],
  "totalCost": 50000, "totalSale": 70000, "profit": 20000,
  "paidAt": null, "deliveredAt": null,            // derivados: fecha más reciente si TODOS los items lo están
  "receipts": [{ "id": "AB12CD34EF", "name": "transferencia.jpg", "type": "image/jpeg", "size": 183920, "uploadedAt": "..." }]
}
```

**Compatibilidad:** los pedidos viejos guardaban `paidAt`/`deliveredAt` solo a nivel pedido. La función `normalize()` (en el servidor) y `norm()` (en el cliente) copian ese estado a cada producto y recalculan los campos derivados. Los pedidos sin `receipts` reciben un arreglo vacío.

### API

Las rutas de admin requieren el header `x-admin-pin: <ADMIN_PIN>`. Sin PIN válido devuelven 401.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/config` | público | Catálogo y datos de transferencia |
| PUT | `/api/config` | admin | Guarda la configuración (sanitizada) |
| POST | `/api/login` | público | `{ pin }` → 200 o 401. Si falta `ADMIN_PIN` → 500 con aviso |
| POST | `/api/orders` | público | Crea un pedido. **Los precios se toman del catálogo del servidor**, no del navegador. Valida padre/madre, jugador, categoría, línea (Bronce/Plata), teléfono (≥ 8 dígitos) y al menos 1 producto |
| GET | `/api/orders` | admin | Lista los pedidos (normalizados), ordenados por fecha |
| PATCH | `/api/orders/:id` | admin | `{ productId?, paid?, delivered? }`. Sin `productId` aplica a todos los productos. Estampa la hora del servidor |
| PUT | `/api/orders/:id` | admin | Edita datos y productos (reglas de la sección 3.2) |
| DELETE | `/api/orders/:id` | admin | Borra el pedido y sus comprobantes |
| POST | `/api/orders/:id/receipts` | admin | Cuerpo = archivo binario; `content-type` imagen o PDF; `x-filename` (URL-encoded). Máximo 4 MB y 10 por pedido |
| GET | `/api/orders/:id/receipts/:rid` | admin | Devuelve el archivo |
| DELETE | `/api/orders/:id/receipts/:rid` | admin | Borra el comprobante |

Los errores se devuelven como `{ "error": "mensaje en castellano" }`.

---

## 5. Deploy y configuración en Netlify

1. Proyecto **pedidosfutbol** importado desde GitHub (`quickconsultant-web`), rama `claude/gracious-mayer-w1vjfe`.
2. **Base directory:** `pedidos-futbol` (obligatorio; sin esto no funciona la API).
3. **Variable de entorno** `ADMIN_PIN`:
   - **Sin** tildar "Contains secret values", porque el escaneo de secretos puede frenar el deploy con un PIN corto.
   - "Same value for all deploy contexts" (o al menos en Production).
   - Después de crearla o cambiarla hay que **volver a publicar** (Deploys → Trigger deploy, o un push a la rama).
4. Netlify Blobs no necesita configuración: funciona automáticamente en las funciones del sitio.
5. Cada push a la rama publica automáticamente.

---

## 6. Ideas pendientes (no implementadas)

- Que cada padre suba su comprobante de pago al cerrar el pedido.
- En "Compras", mostrar también las cajas a comprar (ej. chocolates: 47 unidades = 3 cajas de 20).
- Que "Pagado" registre el pago al proveedor en vez del pago de la familia (hoy significa que **la familia pagó** ese producto).
