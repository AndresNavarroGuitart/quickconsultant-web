/*
 * Tablero de Automatizaciones — Not a Bot Agency
 * ------------------------------------------------
 * Fuente de datos del tablero. Por ahora son datos de ejemplo (mock).
 * Para conectar con un backend real, reemplazar `getProcesos()` por un fetch.
 *
 * Estados posibles:
 *   "operativo"  -> corre sin problemas
 *   "atencion"   -> corre pero con avisos / degradado
 *   "detenido"   -> pausado o con fallo bloqueante
 */

window.TABLERO = {
  // Fecha de la última actualización de estos datos.
  actualizado: "2026-08-28T09:15:00-03:00",

  categorias: {
    ventas: { label: "Ventas & e-commerce", color: "#C84E1E" },
    finanzas: { label: "Finanzas", color: "#20574E" },
    talento: { label: "Talento & RRHH", color: "#03524E" },
    calidad: { label: "Calidad & encuestas", color: "#CC3366" },
    datos: { label: "Datos & reporting", color: "#697082" },
  },

  procesos: [
    {
      id: "actualizador-precios-tn",
      nombre: "Actualizador de precios — Tienda Nube",
      categoria: "ventas",
      estado: "operativo",
      descripcion:
        "Cruza el catálogo exportado de Tienda Nube con la base de un sistema externo y regenera el CSV con precios, promos y costos actualizados, respetando estructura y encoding original.",
      frecuencia: "Manual / a demanda",
      ultimaEjecucion: "2026-08-27T18:40:00-03:00",
      duracionMedia: "≈ 25 s",
      exito7d: 100,
      ejecuciones7d: 6,
      responsable: "Andrés Navarro",
      enlace: "../actualizador-precios-tn/",
      corridas: [
        { fecha: "2026-08-27T18:40:00-03:00", estado: "ok", detalle: "412 SKUs actualizados, 7 sin match (listados aparte)" },
        { fecha: "2026-08-25T11:02:00-03:00", estado: "ok", detalle: "398 SKUs actualizados, 5 sin match" },
        { fecha: "2026-08-21T16:20:00-03:00", estado: "ok", detalle: "405 SKUs actualizados" },
      ],
    },
    {
      id: "facturacion-odoo",
      nombre: "Sincronización de facturación (Odoo)",
      categoria: "finanzas",
      estado: "atencion",
      descripcion:
        "Genera y concilia facturas en Odoo a partir de las ventas del período. Emite alertas cuando hay comprobantes sin conciliar o diferencias de importe.",
      frecuencia: "Diaria · 07:00",
      ultimaEjecucion: "2026-08-28T07:03:00-03:00",
      duracionMedia: "≈ 3 min",
      exito7d: 86,
      ejecuciones7d: 7,
      responsable: "Equipo Finanzas",
      enlace: "../facturacion-app/",
      corridas: [
        { fecha: "2026-08-28T07:03:00-03:00", estado: "aviso", detalle: "2 comprobantes sin conciliar — revisar cliente #1042" },
        { fecha: "2026-08-27T07:02:00-03:00", estado: "ok", detalle: "34 facturas emitidas" },
        { fecha: "2026-08-26T07:02:00-03:00", estado: "ok", detalle: "29 facturas emitidas" },
        { fecha: "2026-08-25T07:04:00-03:00", estado: "error", detalle: "Timeout API Odoo — reintento OK a las 07:20" },
      ],
    },
    {
      id: "portal-proveedores-danangie",
      nombre: "Portal de proveedores — DanAngie",
      categoria: "finanzas",
      estado: "operativo",
      descripcion:
        "Recepción de facturas de proveedores, validación de datos fiscales y carga automática a la cola de pagos. Notifica al proveedor el estado de cada comprobante.",
      frecuencia: "Event-driven (por carga)",
      ultimaEjecucion: "2026-08-28T08:47:00-03:00",
      duracionMedia: "≈ 12 s",
      exito7d: 97,
      ejecuciones7d: 41,
      responsable: "Andrés Navarro",
      enlace: "../portal-proveedores-danangie/",
      corridas: [
        { fecha: "2026-08-28T08:47:00-03:00", estado: "ok", detalle: "Factura A-0003421 validada y encolada" },
        { fecha: "2026-08-28T08:31:00-03:00", estado: "ok", detalle: "Factura A-0003420 validada" },
        { fecha: "2026-08-27T19:12:00-03:00", estado: "aviso", detalle: "CUIT con formato inválido — devuelto al proveedor" },
      ],
    },
    {
      id: "perfil-deportivo-sync",
      nombre: "Perfil Deportivo — sync clubes y partidos",
      categoria: "talento",
      estado: "operativo",
      descripcion:
        "Actualiza perfiles de deportistas, membresías de club y calendario de partidos. Recalcula estados de suscripción y envía recordatorios.",
      frecuencia: "Cada 6 h",
      ultimaEjecucion: "2026-08-28T06:00:00-03:00",
      duracionMedia: "≈ 40 s",
      exito7d: 100,
      ejecuciones7d: 28,
      responsable: "Equipo Producto",
      enlace: "../perfil-deportivo-app/",
      corridas: [
        { fecha: "2026-08-28T06:00:00-03:00", estado: "ok", detalle: "312 perfiles, 18 partidos actualizados" },
        { fecha: "2026-08-28T00:00:00-03:00", estado: "ok", detalle: "310 perfiles actualizados" },
        { fecha: "2026-08-27T18:00:00-03:00", estado: "ok", detalle: "309 perfiles actualizados" },
      ],
    },
    {
      id: "maquina-encuestas-qms",
      nombre: "Máquina de encuestas — QMS (Berlim/Druper)",
      categoria: "calidad",
      estado: "operativo",
      descripcion:
        "Programa encuestas telefónicas de satisfacción por tramo de horas de contrato (PG 04), clasifica respuestas en NC / Observación / Oportunidad y arma el registro RPG 0401-03.",
      frecuencia: "Semanal · lunes 10:00",
      ultimaEjecucion: "2026-08-24T10:00:00-03:00",
      duracionMedia: "≈ 2 min",
      exito7d: 100,
      ejecuciones7d: 1,
      responsable: "Calidad",
      enlace: "../maquina-encuestas/",
      corridas: [
        { fecha: "2026-08-24T10:00:00-03:00", estado: "ok", detalle: "47 encuestas generadas — 3 NC, 6 observaciones" },
        { fecha: "2026-08-17T10:00:00-03:00", estado: "ok", detalle: "51 encuestas generadas — 2 NC" },
      ],
    },
    {
      id: "reporting-semanal",
      nombre: "Reporte semanal de operaciones",
      categoria: "datos",
      estado: "detenido",
      descripcion:
        "Consolida métricas de todas las automatizaciones y arma el PDF/planilla que se envía a dirección los viernes. Pausado a la espera de definir los nuevos KPIs.",
      frecuencia: "Semanal · viernes 17:00",
      ultimaEjecucion: "2026-08-08T17:00:00-03:00",
      duracionMedia: "≈ 90 s",
      exito7d: 0,
      ejecuciones7d: 0,
      responsable: "Andrés Navarro",
      enlace: null,
      corridas: [
        { fecha: "2026-08-08T17:00:00-03:00", estado: "ok", detalle: "Última corrida antes de la pausa" },
      ],
    },
  ],
};
