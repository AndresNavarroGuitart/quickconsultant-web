/*
 * Tablero de Operaciones — Not a Bot Agency
 * ------------------------------------------------
 * Fuente de datos del tablero. Por ahora son datos de ejemplo (mock).
 * Para conectar con un backend real, reemplazar el contenido por un fetch
 * que arme el mismo objeto en `window.TABLERO` antes de que corra app.js.
 *
 * Estados posibles:
 *   "operativo"  -> corre sin problemas
 *   "atencion"   -> corre pero con avisos / degradado
 *   "detenido"   -> pausado o con fallo bloqueante
 */

window.TABLERO = {
  // Fecha de referencia de estos datos (los KPIs toman la más reciente entre esta y
  // la actividad de los módulos Nómina y Pipeline).
  actualizado: "2026-08-28T09:15:00-03:00",

  // Proyectos activos — placeholder hasta que exista el módulo Proyectos.
  proyectosActivos: 11,

  categorias: {
    rrhh: { label: "RRHH & Nómina", color: "#03524E" },
    comercial: { label: "Comercial", color: "#C84E1E" },
    delivery: { label: "Delivery", color: "#20574E" },
    talento: { label: "Talento", color: "#CC3366" },
    administracion: { label: "Administración", color: "#697082" },
  },

  procesos: [
    {
      id: "nomina-empleados",
      nombre: "Nómina de empleados",
      categoria: "rrhh",
      estado: "operativo",
      descripcion:
        "Calcula liquidaciones de sueldo, cargas sociales y recibos de todo el personal (interno y externalizado), consolida novedades del mes y deja los archivos listos para pago y presentación.",
      frecuencia: "Mensual · día 25",
      ultimaEjecucion: "2026-08-25T14:20:00-03:00",
      duracionMedia: "≈ 4 min",
      exito7d: 100,
      ejecuciones7d: 1,
      responsable: "Equipo RRHH",
      enlace: "nomina/index.html",
      corridas: [
        { fecha: "2026-08-25T14:20:00-03:00", estado: "ok", detalle: "38 recibos generados · neto total conciliado" },
        { fecha: "2026-07-25T14:12:00-03:00", estado: "aviso", detalle: "2 legajos sin CBU — completados a mano antes del pago" },
        { fecha: "2026-06-25T14:05:00-03:00", estado: "ok", detalle: "36 recibos generados" },
      ],
    },
    {
      id: "pipeline-clientes",
      nombre: "Pipeline de clientes",
      categoria: "comercial",
      estado: "atencion",
      descripcion:
        "Sincroniza oportunidades del CRM, mueve etapas según actividad, arma el pronóstico de cierre del mes y avisa de leads sin seguimiento hace más de 5 días.",
      frecuencia: "Cada 2 h",
      ultimaEjecucion: "2026-08-28T08:00:00-03:00",
      duracionMedia: "≈ 35 s",
      exito7d: 91,
      ejecuciones7d: 78,
      responsable: "Equipo Comercial",
      enlace: "pipeline/index.html",
      corridas: [
        { fecha: "2026-08-28T08:00:00-03:00", estado: "aviso", detalle: "6 oportunidades sin actividad — recordatorio enviado a los owners" },
        { fecha: "2026-08-28T06:00:00-03:00", estado: "ok", detalle: "24 oportunidades sincronizadas · pronóstico actualizado" },
        { fecha: "2026-08-28T04:00:00-03:00", estado: "error", detalle: "Rate limit del CRM — reintento OK a las 04:12" },
        { fecha: "2026-08-28T02:00:00-03:00", estado: "ok", detalle: "22 oportunidades sincronizadas" },
      ],
    },
    {
      id: "proyectos",
      nombre: "Proyectos",
      categoria: "delivery",
      estado: "operativo",
      descripcion:
        "Consolida horas cargadas, avance de hitos y estado de cada proyecto activo. Marca desvíos de plazo o presupuesto y actualiza el tablero de delivery para el equipo y el cliente.",
      frecuencia: "Diaria · 19:00",
      ultimaEjecucion: "2026-08-27T19:02:00-03:00",
      duracionMedia: "≈ 50 s",
      exito7d: 100,
      ejecuciones7d: 7,
      responsable: "Delivery / PMO",
      enlace: null,
      corridas: [
        { fecha: "2026-08-27T19:02:00-03:00", estado: "ok", detalle: "11 proyectos actualizados · 1 con desvío de plazo (flag)" },
        { fecha: "2026-08-26T19:01:00-03:00", estado: "ok", detalle: "11 proyectos actualizados" },
        { fecha: "2026-08-25T19:03:00-03:00", estado: "ok", detalle: "10 proyectos actualizados" },
      ],
    },
    {
      id: "reclutamiento",
      nombre: "Reclutamiento",
      categoria: "talento",
      estado: "operativo",
      descripcion:
        "Rastrea nuevas postulaciones, hace el primer filtro por requisitos, agenda entrevistas y mantiene al candidato y al hiring manager informados en cada etapa del proceso.",
      frecuencia: "Event-driven (por postulación)",
      ultimaEjecucion: "2026-08-28T09:05:00-03:00",
      duracionMedia: "≈ 15 s",
      exito7d: 96,
      ejecuciones7d: 52,
      responsable: "Talent Acquisition",
      enlace: null,
      corridas: [
        { fecha: "2026-08-28T09:05:00-03:00", estado: "ok", detalle: "Candidato para 'Dev Backend Sr' → agendada entrevista técnica" },
        { fecha: "2026-08-28T08:40:00-03:00", estado: "ok", detalle: "3 postulaciones filtradas · 1 avanza a screening" },
        { fecha: "2026-08-27T17:22:00-03:00", estado: "aviso", detalle: "CV sin formato legible — pasado a revisión manual" },
      ],
    },
    {
      id: "administracion",
      nombre: "Administración",
      categoria: "administracion",
      estado: "atencion",
      descripcion:
        "Concilia facturas emitidas y recibidas, controla vencimientos de impuestos y pagos a proveedores, y arma el resumen diario de caja y cuentas por cobrar/pagar.",
      frecuencia: "Diaria · 07:30",
      ultimaEjecucion: "2026-08-28T07:31:00-03:00",
      duracionMedia: "≈ 2 min",
      exito7d: 88,
      ejecuciones7d: 7,
      responsable: "Administración",
      enlace: null,
      corridas: [
        { fecha: "2026-08-28T07:31:00-03:00", estado: "aviso", detalle: "1 vencimiento impositivo en 48 h · 3 facturas de proveedor sin OC" },
        { fecha: "2026-08-27T07:30:00-03:00", estado: "ok", detalle: "Conciliación al día · caja cuadrada" },
        { fecha: "2026-08-26T07:32:00-03:00", estado: "error", detalle: "Sin conexión al banco — corrida parcial, completada 08:10" },
      ],
    },
  ],
};
