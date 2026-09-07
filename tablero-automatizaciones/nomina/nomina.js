/* Nómina de empleados — listado + ficha (panel del colaborador) + edición
   Persistencia: localStorage. Sin backend. */
(function () {
  "use strict";

  var STORE_KEY = "nba-nomina-empleados";
  var THEME_KEY = "nba-tablero-theme";
  var $app = document.getElementById("app");

  /* ---------- Tema (compartido con el tablero) ---------- */
  (function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    var btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = cur ? (cur === "dark" ? "light" : "dark") : (prefersDark ? "light" : "dark");
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  })();

  /* ---------- Almacenamiento ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw === null && Array.isArray(window.NOMINA_DEMO)) {
        localStorage.setItem(STORE_KEY, JSON.stringify(window.NOMINA_DEMO));
        return window.NOMINA_DEMO.slice();
      }
      return JSON.parse(raw) || [];
    } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); }
    catch (e) { alert("No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado."); }
  }
  function cargarDemo() {
    if (!Array.isArray(window.NOMINA_DEMO)) return;
    save(window.NOMINA_DEMO.slice());
    toast(window.NOMINA_DEMO.length + " colaboradores de ejemplo cargados");
    vistaLista();
  }
  function uid() {
    return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tpl(id) { return document.getElementById(id).content.cloneNode(true); }
  function iniciales(emp) {
    return ((emp.nombre || "").charAt(0) + (emp.apellido || "").charAt(0)).toUpperCase() || "–";
  }
  function nombreCompleto(e) { return ((e.nombre || "") + " " + (e.apellido || "")).trim(); }
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function hoyISO() { return new Date().toISOString().slice(0, 10); }
  function fechaCorta(s) {
    if (!s) return "—";
    var d = new Date(String(s).length === 10 ? s + "T00:00:00" : s);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }
  function diasEntre(a, b) {
    var d1 = new Date(a), d2 = new Date(b);
    if (isNaN(d1) || isNaN(d2) || d2 < d1) return 0;
    return Math.round((d2 - d1) / 86400000) + 1;
  }

  var ESTADO_MOD = {
    "Activo": "activo", "Inactivo": "inactivo",
    "Próximo Ingreso": "proximo", "Std By": "standby",
  };
  function badgeEstado(txt) {
    if (!txt) return "—";
    var mod = ESTADO_MOD[txt];
    return '<span class="badge badge--estado' + (mod ? " badge--" + mod : "") + '">' + esc(txt) + "</span>";
  }

  /* ---------- Datos derivados ---------- */
  function splitCP(e, idx) {
    var parts = (e.clienteProyecto || "").split("/");
    if (idx === 0) return e.cliente || (parts[0] || "").trim();
    return e.proyecto || (parts[1] || "").trim();
  }
  function clienteProyecto(e) {
    var c = splitCP(e, 0), p = splitCP(e, 1);
    return c && p ? c + " / " + p : (c || p);
  }
  function direccionCompat(e) {
    return [e.direccionLegal, e.barrio, e.localidad, e.provincia, e.pais].filter(Boolean).join(", ");
  }
  function ptoUtilizados(e, year) {
    return (e.licencias || []).reduce(function (s, l) {
      if (!l.desde) return s;
      var cuenta = l.estado === "Aprobada" || l.estado === "Tomada" || l.estado === "En curso";
      var y = new Date(l.desde + "T00:00:00").getFullYear();
      return (cuenta && y === year) ? s + (Number(l.dias) || 0) : s;
    }, 0);
  }
  function ultimoSeguimiento(e) {
    return (e.seguimientos || []).slice().sort(function (a, b) {
      return (a.fecha || "") < (b.fecha || "") ? 1 : -1;
    })[0] || null;
  }
  function seguimientoEstado(e) {
    var u = ultimoSeguimiento(e);
    if (!u) return { txt: "Sin seguimientos", tag: "—", ok: false, none: true };
    if (u.proximo && u.proximo >= hoyISO()) return { txt: "Seguimiento al día", tag: "Al día", ok: true };
    return { txt: "Seguimiento pendiente", tag: "Pendiente", ok: false };
  }

  /* ---------- Constantes de formularios ---------- */
  var PAISES = ["Argentina", "Uruguay", "Chile", "Paraguay", "Bolivia", "Perú", "Colombia", "Ecuador", "Venezuela", "México", "Brasil", "España", "Estados Unidos", "Otro"];
  var ESTADOS = ["Activo", "Inactivo", "Próximo Ingreso", "Std By"];
  var DEDICACIONES = ["Full time", "Part time", "Por horas", "Freelance", "Guardia / on-call"];
  var PTO_TIPOS = ["Vacaciones", "Licencia médica", "Licencia especial", "Día de estudio / examen", "Mudanza", "Maternidad / Paternidad", "Duelo", "Sin goce de sueldo"];
  var PTO_ESTADOS = ["Solicitada", "Aprobada", "En curso", "Tomada", "Rechazada"];
  var SEG_TIPOS = ["Mensual", "Quincenal", "Semanal", "Trimestral", "Puntual", "Onboarding", "Offboarding"];
  var EQ_GESTION = ["A cargo del cliente", "A cargo de Not a Bot", "Equipo propio del colaborador"];
  var EQ_ESTADOS = ["Asignado", "En tránsito", "Pendiente de entrega", "Devuelto", "En reparación", "Baja"];
  var REL_ESTADOS = ["Todo en orden", "Requiere atención", "Riesgo de continuidad"];
  var REL_MOD = { "Todo en orden": "ok", "Requiere atención": "warn", "Riesgo de continuidad": "stop" };
  var DOC_TIPOS = ["Contrato", "Identificación (DNI/RUT/Cédula)", "CV", "Certificado", "Alta AFIP / Monotributo", "Título / Diploma", "Constancia de CBU", "Otro"];
  var ADM_CAMPOS = ["legajo", "centroCosto", "modalidadPago", "banco", "cuenta", "alias", "moneda", "remuneracion", "periodicidad", "cobertura", "notas"];

  var REQUERIDOS = ["nombre", "apellido", "estado", "documento", "mail", "pais", "rol", "dedicacion"];
  function nombreCampo(k) {
    return {
      nombre: "Nombre", apellido: "Apellido", estado: "Estado", documento: "ID (DNI/RUT/Cédula)",
      mail: "Mail", pais: "País", rol: "Rol", dedicacion: "Dedicación",
    }[k] || k;
  }

  /* markup de campos */
  function campo(name, label, type, req, extra, val) {
    return '<label class="campo"><span>' + esc(label) + (req ? " <b>*</b>" : "") + "</span>" +
      '<input type="' + (type || "text") + '" name="' + name + '"' + (req ? " required" : "") +
      (val != null && val !== "" ? ' value="' + esc(val) + '"' : "") + (extra || "") + " /></label>";
  }
  function campoSel(name, label, opts, req, val) {
    return '<label class="campo"><span>' + esc(label) + (req ? " <b>*</b>" : "") + '</span><select name="' + name + '"' +
      (req ? " required" : "") + '><option value="">Elegí…</option>' +
      opts.map(function (o) {
        return "<option" + (String(val) === String(o) ? " selected" : "") + ">" + esc(o) + "</option>";
      }).join("") + "</select></label>";
  }
  function grupo(titulo, campos) {
    return '<fieldset class="fx-fs"><legend>' + esc(titulo) + '</legend><div class="campos">' + campos.join("") + "</div></fieldset>";
  }
  function dlRows(rows) {
    return '<dl class="fx-dl">' + rows.filter(Boolean).map(function (r) {
      var v = r[1];
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + (v == null || v === "" ? "—" : v) + "</dd></div>";
    }).join("") + "</dl>";
  }

  /* ---------- Persistencia parcial ---------- */
  function patchEmp(empId, patch) {
    var next = load();
    var i = next.findIndex(function (e) { return e.id === empId; });
    if (i < 0) return null;
    next[i] = Object.assign({}, next[i], patch, { actualizado: new Date().toISOString() });
    save(next);
    return next[i];
  }
  function getEmp(empId) { return load().find(function (e) { return e.id === empId; }) || null; }

  /* ================= Vista: lista ================= */
  function vistaLista() {
    $app.innerHTML = "";
    $app.appendChild(tpl("tpl-lista"));

    var $tbody = document.getElementById("empleados");
    var $tablaWrap = document.getElementById("tablaWrap");
    var $vacio = document.getElementById("vacio");
    var $count = document.getElementById("listaCount");
    var $buscar = document.getElementById("buscar");
    var $demo = document.getElementById("cargarDemo");
    if ($demo) $demo.addEventListener("click", cargarDemo);

    function irA(id) { if (id) location.hash = "#/empleado/" + id; }

    function pinta(filtro) {
      var list = load();
      var q = (filtro || "").trim().toLowerCase();
      var vis = list.filter(function (e) {
        if (!q) return true;
        return [e.nombre, e.apellido, e.documento, e.mail, e.pais, e.estado,
          e.cliente, e.proyecto, e.clienteProyecto, e.rol, e.dedicacion]
          .join(" ").toLowerCase().indexOf(q) !== -1;
      });

      $vacio.hidden = list.length !== 0;
      $tablaWrap.hidden = list.length === 0;
      $count.textContent = list.length
        ? (vis.length === list.length ? list.length + " colaboradores" : vis.length + " de " + list.length)
        : "";

      $tbody.innerHTML = vis.map(function (e) {
        var avatar = e.foto
          ? '<img class="avatar" src="' + esc(e.foto) + '" alt="" />'
          : '<span class="avatar">' + esc(iniciales(e)) + "</span>";
        var nombre = esc(nombreCompleto(e));
        var cp = clienteProyecto(e);
        var seg = seguimientoEstado(e);
        return (
          '<tr tabindex="0" data-id="' + esc(e.id) + '" aria-label="Abrir ficha de ' + nombre + '">' +
            '<th scope="row" class="col-emp"><span class="col-emp__wrap">' + avatar +
              '<a class="planilla__nombre" href="#/empleado/' + esc(e.id) + '">' + nombre + "</a></span></th>" +
            "<td>" + badgeEstado(e.estado) + "</td>" +
            '<td class="col-cliente">' + (cp ? esc(cp) : "—") + "</td>" +
            '<td class="col-rol">' + esc(e.rol || "—") + "</td>" +
            '<td class="col-pais">' + esc(e.pais || "—") + "</td>" +
            '<td class="col-dedic">' + esc(e.dedicacion || "—") + "</td>" +
            '<td class="col-inicio">' + fechaCorta(e.inicio) + "</td>" +
            '<td class="col-seg"><span class="seg-tag' + (seg.ok ? " seg-tag--ok" : seg.none ? "" : " seg-tag--pend") + '">' + esc(seg.tag) + "</span></td>" +
            '<td class="col-chev" aria-hidden="true">›</td>' +
          "</tr>"
        );
      }).join("");
    }

    $tbody.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) return;
      var tr = ev.target.closest("tr");
      if (tr) irA(tr.dataset.id);
    });
    $tbody.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var tr = ev.target.closest("tr");
      if (tr) { ev.preventDefault(); irA(tr.dataset.id); }
    });

    $buscar.addEventListener("input", function () { pinta(this.value); });
    pinta("");
  }

  /* ================= Vista: ficha (panel del colaborador) ================= */
  function fichaTabs(id, sec) {
    function t(k, label) {
      var href = k === "panel" ? "#/empleado/" + id : "#/empleado/" + id + "/" + k;
      return '<a class="fx-tab' + (sec === k ? " is-on" : "") + '" href="' + href + '">' + esc(label) + "</a>";
    }
    return '<div class="fx-tabs">' + t("panel", "Panel") + t("doc", "Documentos") + t("adm", "Administración") + "</div>";
  }

  function sumItem(ico, txt) {
    return '<div class="fx-sum"><span class="fx-sum__ico" aria-hidden="true">' + ico + "</span>" + esc(txt) + "</div>";
  }

  function cardDatos(e) {
    var alt = [e.contactoAltNombre, e.contactoAltVinculo, e.contactoAltTelefono].filter(Boolean).join(" · ");
    var rows = [
      ["ID", esc(e.documento)],
      ["Mail", e.mail ? '<a href="mailto:' + esc(e.mail) + '">' + esc(e.mail) + "</a>" : ""],
      ["Teléfono", esc(e.telefono)],
      ["Dirección completa", esc(e.direccionCompleta || direccionCompat(e))],
      ["Contacto alternativo", esc(alt)],
    ];
    if (e.pasaporte) rows.push(["N.º de pasaporte", esc(e.pasaporte)]);
    if (e.cuit) rows.push(["CUIT / CUIL", esc(e.cuit)]);
    if (e.linkedin) rows.push(["LinkedIn", '<a href="' + esc(e.linkedin) + '" target="_blank" rel="noopener">' + esc(String(e.linkedin).replace(/^https?:\/\//, "")) + "</a>"]);
    return '<section class="fx-card"><h2 class="fx-card__title">Datos personales</h2>' + dlRows(rows) + "</section>";
  }

  function cardAsignacion(e) {
    var rows = [
      ["Cliente", esc(splitCP(e, 0))],
      ["Proyecto", esc(splitCP(e, 1))],
      ["Punto de contacto del cliente", esc(e.puntoContactoCliente)],
      ["Responsable Not a Bot", esc(e.responsableNotaBot)],
      ["Rol", esc(e.rol)],
      ["Dedicación", e.dedicacion ? '<span class="badge">' + esc(e.dedicacion) + "</span>" : ""],
    ];
    return '<section class="fx-card"><h2 class="fx-card__title">Asignación operativa</h2>' + dlRows(rows) + "</section>";
  }

  function cardPTO(e, year) {
    var util = ptoUtilizados(e, year);
    var acordados = Number(e.ptoAcordados) || 0;
    var disp = acordados - util;
    return '<section class="fx-card fx-pto">' +
      '<h2 class="fx-card__title">PTO</h2>' +
      '<div class="fx-pto__grid">' +
        '<div class="fx-pto__big">' +
          '<span class="fx-pto__ico" aria-hidden="true">▤</span>' +
          "<div><small>PTO disponibles</small><b>" + disp + " días</b></div>" +
        "</div>" +
        '<dl class="fx-dl fx-dl--tight">' +
          "<div><dt>PTO acordados</dt><dd>" + acordados + " días por año</dd></div>" +
          "<div><dt>PTO utilizados en " + year + "</dt><dd>" + util + " días</dd></div>" +
        "</dl>" +
      "</div>" +
      '<p class="fx-note">Calculado automáticamente: PTO acordados − días aprobados del año calendario</p>' +
      '<div class="fx-actions"><button type="button" class="btn btn--ghost" data-act="pto">Ver movimientos de PTO</button></div>' +
      '<div class="fx-expand" id="ptoExpand" hidden></div>' +
      "</section>";
  }

  function cardEquipo(e) {
    var q = e.equipamiento || {};
    var rows = [
      ["Gestión del equipo", esc(q.gestion)],
      ["Cliente responsable", esc(q.clienteResponsable)],
      ["Fecha de entrega", q.fechaEntrega ? fechaCorta(q.fechaEntrega) : ""],
      ["Equipo", esc(q.equipo)],
      ["N.º de serie", esc(q.nroSerie)],
      ["Estado", q.estado ? '<span class="badge">' + esc(q.estado) + "</span>" : ""],
    ];
    return '<section class="fx-card"><h2 class="fx-card__title">Equipamiento</h2>' + dlRows(rows) +
      '<div class="fx-actions"><button type="button" class="btn btn--ghost" data-act="equipo">Ver historial del equipo</button></div>' +
      '<div class="fx-expand" id="equipoExpand" hidden></div>' +
      "</section>";
  }

  function cardSeguimiento(e) {
    var arr = (e.seguimientos || []).slice().sort(function (a, b) { return (a.fecha || "") < (b.fecha || "") ? 1 : -1; });
    var filas = arr.length ? arr.map(function (s) {
      return "<tr><td>" + fechaCorta(s.fecha) + "</td><td>" + esc(s.tipo || "—") +
        "</td><td>" + esc(s.nota || "—") + "</td><td>" + esc(s.responsable || "—") +
        "</td><td>" + fechaCorta(s.proximo) +
        '</td><td class="col-num"><button type="button" class="mini-del" data-delseg="' + esc(s.id) + '" aria-label="Quitar">✕</button></td></tr>';
    }).join("") : '<tr><td colspan="6" class="sub-vacio">Sin seguimientos registrados.</td></tr>';
    return '<section class="fx-card"><h2 class="fx-card__title">Seguimiento de la persona</h2>' +
      '<div class="tabla-wrap"><table class="planilla planilla--mini"><thead><tr>' +
        "<th>Fecha</th><th>Tipo</th><th>Nota</th><th>Responsable</th><th>Próximo</th><th></th>" +
      '</tr></thead><tbody>' + filas + "</tbody></table></div>" +
      '<div class="fx-actions"><button type="button" class="btn btn--ghost" data-act="seg">+ Registrar seguimiento</button></div>' +
      '<div class="fx-expand" id="segExpand" hidden></div>' +
      "</section>";
  }

  function cardRelacion(e, mod) {
    var r = e.relacion || {};
    var seg = REL_ESTADOS.map(function (st) {
      var m = REL_MOD[st];
      return '<button type="button" class="fx-rel__opt fx-rel__opt--' + m + (r.estado === st ? " is-on" : "") +
        '" data-rel="' + esc(st) + '"><i></i>' + esc(st) + "</button>";
    }).join("");
    var ultima = [r.ultimaActualizacion ? fechaCorta(r.ultimaActualizacion) : "", esc(r.actualizadoPor)].filter(Boolean).join(" · ");
    var prox = [esc(r.proximaAccion), r.proximaAccionFecha ? fechaCorta(r.proximaAccionFecha) : ""].filter(Boolean).join(" · ");
    var rows = [
      ["Estado actual", r.estado ? '<span class="pill pill--' + mod + '">' + esc(r.estado) + "</span>" : ""],
      ["Última actualización", ultima],
      ["Motivo", esc(r.motivo)],
      ["Próxima acción", prox],
      ["Oportunidad", r.oportunidad ? '<span class="pill pill--op">' + esc(r.oportunidad) + "</span>" : ""],
    ];
    return '<section class="fx-card fx-rel fx-rel--' + mod + '">' +
      '<h2 class="fx-card__title">Estado de la relación <span class="fx-help" title="Verde: todo en orden. Amarillo: observaciones reiteradas. Rojo: posible corte por colaborador, cliente o Not a Bot.">?</span></h2>' +
      '<div class="fx-rel__seg">' + seg + "</div>" +
      dlRows(rows) +
      '<div class="fx-actions"><button type="button" class="btn btn--ghost" data-act="rel">Actualizar estado</button></div>' +
      '<div class="fx-expand" id="relExpand" hidden></div>' +
      '<p class="fx-note">Amarillo: observaciones reiteradas · Rojo: posible corte por colaborador, cliente o Not a Bot.</p>' +
      "</section>";
  }

  function vistaFicha(id, sec) {
    sec = sec || "panel";
    var emp = getEmp(id);
    if (!emp) { location.hash = "#/"; return; }

    var seg = seguimientoEstado(emp);
    var relMod = REL_MOD[(emp.relacion || {}).estado] || "ok";
    var year = new Date().getFullYear();

    var avatarHTML = emp.foto
      ? '<img class="avatar avatar--lg" src="' + esc(emp.foto) + '" alt="" />'
      : '<span class="avatar avatar--lg">' + esc(iniciales(emp)) + "</span>";
    var sub = [emp.rol, clienteProyecto(emp)].filter(Boolean).join(" · ");

    var head =
      '<nav class="fx-crumb"><a href="#/">Nómina</a> / <span>' + esc(nombreCompleto(emp)) + "</span></nav>" +
      '<header class="fx-head">' +
        '<div class="fx-id">' + avatarHTML +
          "<div><h1>" + esc(nombreCompleto(emp)) + " " + badgeEstado(emp.estado) + "</h1>" +
          (sub ? '<p class="fx-sub">' + esc(sub) + "</p>" : "") + "</div>" +
        "</div>" +
        '<a class="btn btn--ghost" href="#/empleado/' + esc(emp.id) + '/editar">✎ Editar</a>' +
      "</header>" +
      '<div class="fx-summary">' +
        sumItem("◷", emp.dedicacion || "Dedicación sin definir") +
        sumItem("⚑", emp.pais || "País sin definir") +
        sumItem("▤", "Ingreso " + fechaCorta(emp.inicio)) +
        sumItem(seg.ok ? "✓" : "⚠", seg.txt) +
      "</div>" +
      fichaTabs(emp.id, sec);

    var body;
    if (sec === "doc") {
      body = '<section class="fx-card" id="cardDocs"></section>';
    } else if (sec === "adm") {
      body = '<section class="fx-card" id="cardAdm"></section>';
    } else {
      body = '<div class="fx-grid">' +
        '<div class="fx-col">' + cardDatos(emp) + cardPTO(emp, year) + cardEquipo(emp) + "</div>" +
        '<div class="fx-col">' + cardAsignacion(emp) + cardSeguimiento(emp) + cardRelacion(emp, relMod) + "</div>" +
      "</div>";
    }

    $app.innerHTML = '<div id="fichaRoot">' + head + body + "</div>";

    if (sec === "doc") renderDocumentos(emp.id);
    else if (sec === "adm") renderAdministracion(emp.id);
    else wireFicha(emp.id);

    window.scrollTo(0, 0);
  }

  /* ---------- Paneles desplegables del panel ---------- */
  function ptoPanel(empId) {
    var emp = getEmp(empId);
    var arr = emp.licencias || [];
    var filas = arr.length ? arr.map(function (l) {
      return "<tr><td>" + esc(l.tipo) + "</td><td>" + fechaCorta(l.desde) + "</td><td>" + fechaCorta(l.hasta) +
        '</td><td class="col-num">' + esc(l.dias || "—") + '</td><td><span class="badge">' + esc(l.estado) + "</span>" +
        '</td><td class="col-num"><button type="button" class="mini-del" data-delpto="' + esc(l.id) + '" aria-label="Quitar">✕</button></td></tr>';
    }).join("") : '<tr><td colspan="6" class="sub-vacio">Sin movimientos de PTO.</td></tr>';
    return '<div class="tabla-wrap"><table class="planilla planilla--mini"><thead><tr>' +
      '<th>Tipo</th><th>Desde</th><th>Hasta</th><th class="col-num">Días</th><th>Estado</th><th></th>' +
      '</tr></thead><tbody>' + filas + "</tbody></table></div>" +
      '<form class="sub-form" id="ptoForm">' +
        campoSel("tipo", "Tipo", PTO_TIPOS, true) +
        campoSel("estado", "Estado", PTO_ESTADOS, true) +
        campo("desde", "Desde", "date", true) +
        campo("hasta", "Hasta", "date", true) +
        '<button type="submit" class="btn">Agregar movimiento</button>' +
      "</form>";
  }

  function segForm(empId) {
    var emp = getEmp(empId);
    return '<form class="sub-form" id="segForm">' +
      campo("fecha", "Fecha", "date", true, "", hoyISO()) +
      campoSel("tipo", "Tipo", SEG_TIPOS, true, "Mensual") +
      '<label class="campo campo--wide"><span>Nota</span><input type="text" name="nota" /></label>' +
      campo("responsable", "Responsable", "text", false, "", emp.responsableNotaBot || "") +
      campo("proximo", "Próximo", "date", false) +
      '<button type="submit" class="btn">Registrar</button>' +
      "</form>";
  }

  function equipoPanel(empId) {
    var emp = getEmp(empId);
    var q = emp.equipamiento || {};
    var h = q.historial || [];
    var hist = h.length ? '<ul class="fx-hist">' + h.map(function (x) {
      return "<li><b>" + fechaCorta(x.fecha) + "</b> — " + esc(x.evento) + "</li>";
    }).join("") + "</ul>" : '<p class="sub-vacio">Sin historial cargado.</p>';
    return hist +
      '<form class="sub-form" id="equipoForm">' +
        campoSel("gestion", "Gestión del equipo", EQ_GESTION, false, q.gestion) +
        campo("clienteResponsable", "Cliente responsable", "text", false, "", q.clienteResponsable) +
        campo("fechaEntrega", "Fecha de entrega", "date", false, "", q.fechaEntrega) +
        campo("equipo", "Equipo", "text", false, "", q.equipo) +
        campo("nroSerie", "N.º de serie", "text", false, "", q.nroSerie) +
        campoSel("estado", "Estado", EQ_ESTADOS, false, q.estado) +
        '<button type="submit" class="btn">Guardar equipamiento</button>' +
      "</form>";
  }

  function abrirRelForm(empId, estadoPre) {
    var el = document.getElementById("relExpand");
    if (!el) return;
    var emp = getEmp(empId);
    var r = emp.relacion || {};
    el.innerHTML = '<form class="sub-form" id="relForm">' +
      campoSel("estado", "Estado", REL_ESTADOS, true, estadoPre || r.estado) +
      campo("actualizadoPor", "Actualizado por", "text", false, "", r.actualizadoPor || emp.responsableNotaBot || "") +
      '<label class="campo campo--wide"><span>Motivo</span><input type="text" name="motivo" value="' + esc(r.motivo || "") + '" /></label>' +
      campo("proximaAccion", "Próxima acción", "text", false, "", r.proximaAccion) +
      campo("proximaAccionFecha", "Fecha próxima acción", "date", false, "", r.proximaAccionFecha) +
      '<label class="campo campo--wide"><span>Oportunidad</span><input type="text" name="oportunidad" value="' + esc(r.oportunidad || "") + '" /></label>' +
      '<button type="submit" class="btn">Guardar estado</button>' +
      "</form>";
    el.hidden = false;
    var s = el.querySelector("select[name=estado]");
    if (s) s.focus();
  }

  function toggleExpand(id, builder) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.hidden || !el.innerHTML) { el.innerHTML = builder(); el.hidden = false; }
    else { el.hidden = true; el.innerHTML = ""; }
  }

  function wireFicha(empId) {
    var root = document.getElementById("fichaRoot");
    if (!root) return;

    root.addEventListener("click", function (ev) {
      var relBtn = ev.target.closest("[data-rel]");
      if (relBtn) { abrirRelForm(empId, relBtn.getAttribute("data-rel")); return; }

      var act = ev.target.closest("[data-act]");
      if (act) {
        var kind = act.getAttribute("data-act");
        if (kind === "pto") toggleExpand("ptoExpand", function () { return ptoPanel(empId); });
        else if (kind === "equipo") toggleExpand("equipoExpand", function () { return equipoPanel(empId); });
        else if (kind === "seg") toggleExpand("segExpand", function () { return segForm(empId); });
        else if (kind === "rel") abrirRelForm(empId, (getEmp(empId).relacion || {}).estado || "Todo en orden");
        return;
      }

      var dseg = ev.target.closest("[data-delseg]");
      if (dseg) {
        patchEmp(empId, { seguimientos: (getEmp(empId).seguimientos || []).filter(function (s) { return s.id !== dseg.getAttribute("data-delseg"); }) });
        toast("Seguimiento quitado"); vistaFicha(empId, "panel"); return;
      }
      var dpto = ev.target.closest("[data-delpto]");
      if (dpto) {
        patchEmp(empId, { licencias: (getEmp(empId).licencias || []).filter(function (l) { return l.id !== dpto.getAttribute("data-delpto"); }) });
        toast("Movimiento quitado"); vistaFicha(empId, "panel"); return;
      }
    });

    root.addEventListener("submit", function (ev) {
      var f = ev.target;
      if (f.id === "ptoForm") {
        ev.preventDefault();
        if (!f.tipo.value || !f.estado.value || !f.desde.value || !f.hasta.value) { toast("Completá todos los campos"); return; }
        if (new Date(f.hasta.value) < new Date(f.desde.value)) { toast("‘Hasta’ es anterior a ‘Desde’"); return; }
        var reg = { id: uid(), tipo: f.tipo.value, estado: f.estado.value, desde: f.desde.value, hasta: f.hasta.value };
        reg.dias = diasEntre(reg.desde, reg.hasta);
        patchEmp(empId, { licencias: (getEmp(empId).licencias || []).concat([reg]) });
        toast("Movimiento agregado"); vistaFicha(empId, "panel"); return;
      }
      if (f.id === "segForm") {
        ev.preventDefault();
        if (!f.fecha.value || !f.tipo.value) { toast("Completá fecha y tipo"); return; }
        var s = { id: uid(), fecha: f.fecha.value, tipo: f.tipo.value, nota: f.nota.value.trim(), responsable: f.responsable.value.trim(), proximo: f.proximo.value };
        patchEmp(empId, { seguimientos: (getEmp(empId).seguimientos || []).concat([s]) });
        toast("Seguimiento registrado"); vistaFicha(empId, "panel"); return;
      }
      if (f.id === "relForm") {
        ev.preventDefault();
        if (!f.estado.value) { toast("Elegí un estado"); return; }
        patchEmp(empId, { relacion: {
          estado: f.estado.value,
          motivo: f.motivo.value.trim(),
          proximaAccion: f.proximaAccion.value.trim(),
          proximaAccionFecha: f.proximaAccionFecha.value,
          oportunidad: f.oportunidad.value.trim(),
          actualizadoPor: f.actualizadoPor.value.trim(),
          ultimaActualizacion: hoyISO(),
        } });
        toast("Estado de la relación actualizado"); vistaFicha(empId, "panel"); return;
      }
      if (f.id === "equipoForm") {
        ev.preventDefault();
        var q = Object.assign({}, getEmp(empId).equipamiento || {});
        ["gestion", "clienteResponsable", "fechaEntrega", "equipo", "nroSerie", "estado"].forEach(function (k) {
          if (f.elements[k]) q[k] = f.elements[k].value.trim();
        });
        patchEmp(empId, { equipamiento: q });
        toast("Equipamiento actualizado"); vistaFicha(empId, "panel"); return;
      }
    });
  }

  /* ---------- Solapa: Documentos ---------- */
  function renderDocumentos(empId) {
    var emp = getEmp(empId); if (!emp) return;
    var arr = emp.documentos || [];
    var filas = arr.length ? arr.map(function (d) {
      var archivo = d.archivo
        ? '<a class="doc-link" href="' + esc(d.archivo) + '" target="_blank" rel="noopener">abrir</a>'
        : (d.archivoNombre ? esc(d.archivoNombre) : "—");
      return "<tr><td>" + esc(d.nombre) + "</td><td>" + esc(d.tipo || "—") + "</td><td>" + fechaCorta(d.fecha) +
        "</td><td>" + archivo +
        '</td><td class="col-num"><button type="button" class="mini-del" data-deldoc="' + esc(d.id) + '" aria-label="Quitar">✕</button></td></tr>';
    }).join("") : '<tr><td colspan="5" class="sub-vacio">Sin documentos cargados.</td></tr>';

    var el = document.getElementById("cardDocs");
    if (!el) return;
    el.innerHTML =
      '<h2 class="fx-card__title">Documentos <span class="fx-chip">' + arr.length + "</span></h2>" +
      '<div class="tabla-wrap"><table class="planilla planilla--mini"><thead><tr>' +
        "<th>Documento</th><th>Tipo</th><th>Fecha</th><th>Archivo</th><th></th>" +
      '</tr></thead><tbody>' + filas + "</tbody></table></div>" +
      '<form class="sub-form" id="docForm">' +
        campo("nombre", "Nombre del documento", "text", true) +
        campoSel("tipo", "Tipo", DOC_TIPOS, true) +
        campo("fecha", "Fecha", "date", false) +
        '<label class="campo"><span>Archivo (opcional)</span><input type="file" name="archivo" /></label>' +
        '<p class="hint campo--wide">Los archivos se guardan solo en este navegador. Máximo 4 MB.</p>' +
        '<button type="submit" class="btn">Agregar documento</button>' +
      "</form>";

    el.querySelector("#docForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target;
      var reg = { id: uid(), nombre: f.nombre.value.trim(), tipo: f.tipo.value, fecha: f.fecha.value, archivo: "", archivoNombre: "" };
      if (!reg.nombre || !reg.tipo) { toast("Completá nombre y tipo"); return; }
      var file = f.archivo.files && f.archivo.files[0];
      var guardar = function () {
        patchEmp(empId, { documentos: (getEmp(empId).documentos || []).concat([reg]) });
        toast("Documento agregado"); renderDocumentos(empId);
      };
      if (file) {
        if (file.size > 4 * 1024 * 1024) { toast("El archivo supera los 4 MB"); return; }
        reg.archivoNombre = file.name;
        var reader = new FileReader();
        reader.onload = function () { reg.archivo = reader.result; guardar(); };
        reader.readAsDataURL(file);
      } else { guardar(); }
    });
    el.querySelector("tbody").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-deldoc]"); if (!b) return;
      patchEmp(empId, { documentos: (getEmp(empId).documentos || []).filter(function (d) { return d.id !== b.dataset.deldoc; }) });
      toast("Documento quitado"); renderDocumentos(empId);
    });
  }

  /* ---------- Solapa: Administración ---------- */
  function renderAdministracion(empId) {
    var emp = getEmp(empId); if (!emp) return;
    var a = emp.administracion || {};
    var el = document.getElementById("cardAdm");
    if (!el) return;
    el.innerHTML =
      '<h2 class="fx-card__title">Administración</h2>' +
      '<form class="sub-form" id="admForm">' +
        campo("legajo", "Legajo", "text", false, "", a.legajo) +
        campo("centroCosto", "Centro de costo", "text", false, "", a.centroCosto) +
        campoSel("modalidadPago", "Modalidad de pago", ["Transferencia bancaria", "Efectivo", "Cheque", "Plataforma de pago"], false, a.modalidadPago) +
        campo("banco", "Banco", "text", false, "", a.banco) +
        campo("cuenta", "CBU / IBAN / N.º de cuenta", "text", false, "", a.cuenta) +
        campo("alias", "Alias", "text", false, "", a.alias) +
        campoSel("moneda", "Moneda", ["ARS", "UYU", "USD", "EUR", "CLP", "COP", "MXN", "BRL"], false, a.moneda) +
        campo("remuneracion", "Remuneración bruta", "number", false, ' min="0" step="0.01"', a.remuneracion) +
        campoSel("periodicidad", "Periodicidad", ["Mensual", "Quincenal", "Semanal", "Por hora", "Por entregable"], false, a.periodicidad) +
        campo("cobertura", "Obra social / Cobertura", "text", false, "", a.cobertura) +
        '<label class="campo campo--wide"><span>Notas</span><input type="text" name="notas" value="' + esc(a.notas || "") + '" /></label>' +
        '<button type="submit" class="btn">Guardar administración</button>' +
      "</form>";
    el.querySelector("#admForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target, obj = {};
      ADM_CAMPOS.forEach(function (k) { obj[k] = f.elements[k] ? f.elements[k].value.trim() : ""; });
      patchEmp(empId, { administracion: obj });
      toast("Administración guardada");
    });
  }

  /* ================= Vista: alta / edición ================= */
  function vistaEditar(id) {
    var emp = id ? getEmp(id) : null;
    if (id && !emp) { location.hash = "#/"; return; }
    var nuevo = !emp;
    var e = emp || {};
    var q = e.equipamiento || {};
    var fotoData = e.foto || "";

    var html =
      '<nav class="fx-crumb"><a href="#/">Nómina</a> / <span>' + (nuevo ? "Nuevo colaborador" : esc(nombreCompleto(e))) + "</span></nav>" +
      '<header class="fx-head"><div class="fx-id"><div><h1>' + (nuevo ? "Nuevo colaborador" : "Editar · " + esc(nombreCompleto(e))) + "</h1>" +
        '<p class="fx-sub">Completá los datos y guardá los cambios.</p></div></div></header>' +

      '<form class="fx-editform" id="empForm" novalidate>' +

        grupo("Identidad", [
          campo("nombre", "Nombre", "text", true, "", e.nombre),
          campo("apellido", "Apellido", "text", true, "", e.apellido),
          campoSel("estado", "Estado", ESTADOS, true, e.estado),
          '<label class="campo"><span>Foto</span><input type="file" name="foto" accept="image/*" /></label>',
        ]) +

        grupo("Datos personales", [
          campo("documento", "ID (DNI / RUT / Cédula)", "text", true, "", e.documento),
          campo("mail", "Mail", "email", true, "", e.mail),
          campo("telefono", "Teléfono", "text", false, "", e.telefono),
          '<label class="campo campo--wide"><span>Dirección completa</span><input type="text" name="direccionCompleta" value="' + esc(e.direccionCompleta || direccionCompat(e)) + '" /></label>',
          campo("contactoAltNombre", "Contacto alternativo · nombre", "text", false, "", e.contactoAltNombre),
          campo("contactoAltVinculo", "Contacto alternativo · vínculo", "text", false, "", e.contactoAltVinculo),
          campo("contactoAltTelefono", "Contacto alternativo · teléfono", "text", false, "", e.contactoAltTelefono),
          campo("pasaporte", "N.º de pasaporte", "text", false, "", e.pasaporte),
          campo("cuit", "CUIT / CUIL", "text", false, "", e.cuit),
          campo("linkedin", "LinkedIn", "url", false, "", e.linkedin),
        ]) +

        grupo("Asignación operativa", [
          campo("cliente", "Cliente", "text", false, "", splitCP(e, 0)),
          campo("proyecto", "Proyecto", "text", false, "", splitCP(e, 1)),
          campo("puntoContactoCliente", "Punto de contacto del cliente", "text", false, "", e.puntoContactoCliente),
          campo("responsableNotaBot", "Responsable Not a Bot", "text", false, "", e.responsableNotaBot),
          campo("rol", "Rol", "text", true, "", e.rol),
          campoSel("dedicacion", "Dedicación", DEDICACIONES, true, e.dedicacion),
          campoSel("pais", "País", PAISES, true, e.pais),
          campo("inicio", "Fecha de ingreso", "date", false, "", e.inicio),
        ]) +

        grupo("PTO", [
          campo("ptoAcordados", "PTO acordados (días por año)", "number", false, ' min="0" step="1"', e.ptoAcordados),
        ]) +

        grupo("Equipamiento", [
          campoSel("eq_gestion", "Gestión del equipo", EQ_GESTION, false, q.gestion),
          campo("eq_clienteResponsable", "Cliente responsable", "text", false, "", q.clienteResponsable),
          campo("eq_fechaEntrega", "Fecha de entrega", "date", false, "", q.fechaEntrega),
          campo("eq_equipo", "Equipo", "text", false, "", q.equipo),
          campo("eq_nroSerie", "N.º de serie", "text", false, "", q.nroSerie),
          campoSel("eq_estado", "Estado del equipo", EQ_ESTADOS, false, q.estado),
        ]) +

        '<p class="form-error" id="formError" hidden></p>' +
        '<div class="fx-actions fx-actions--bar">' +
          '<button type="submit" class="btn">' + (nuevo ? "Crear colaborador" : "Guardar cambios") + "</button>" +
          '<a class="btn btn--ghost" href="' + (nuevo ? "#/" : "#/empleado/" + esc(e.id)) + '">Cancelar</a>' +
          (nuevo ? "" : '<button type="button" class="btn btn--ghost fx-del" id="btnEliminar">Eliminar colaborador</button>') +
        "</div>" +
      "</form>";

    $app.innerHTML = html;
    window.scrollTo(0, 0);

    var $form = document.getElementById("empForm");
    var $err = document.getElementById("formError");

    $form.elements.foto.addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        $err.hidden = false; $err.textContent = "La foto supera los 3 MB. Elegí una más liviana.";
        this.value = ""; return;
      }
      var reader = new FileReader();
      reader.onload = function () { fotoData = reader.result; };
      reader.readAsDataURL(file);
    });

    var $del = document.getElementById("btnEliminar");
    if ($del) $del.addEventListener("click", function () {
      if (!confirm("¿Eliminar a " + nombreCompleto(e) + " de la nómina?")) return;
      save(load().filter(function (x) { return x.id !== e.id; }));
      toast("Colaborador eliminado");
      location.hash = "#/";
    });

    $form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      $err.hidden = true;
      function val(n) { return $form.elements[n] ? $form.elements[n].value.trim() : ""; }

      var d = {};
      ["nombre", "apellido", "estado", "documento", "mail", "telefono", "direccionCompleta",
        "contactoAltNombre", "contactoAltVinculo", "contactoAltTelefono", "pasaporte", "cuit", "linkedin",
        "cliente", "proyecto", "puntoContactoCliente", "responsableNotaBot", "rol", "dedicacion", "pais", "inicio", "ptoAcordados"
      ].forEach(function (k) { d[k] = val(k); });

      var faltan = REQUERIDOS.filter(function (k) { return !d[k]; });
      if (faltan.length) {
        $err.hidden = false;
        $err.textContent = "Faltan campos obligatorios: " + faltan.map(nombreCampo).join(", ");
        if ($form.elements[faltan[0]]) $form.elements[faltan[0]].focus();
        return;
      }
      if (d.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.mail)) {
        $err.hidden = false; $err.textContent = "El mail no tiene un formato válido.";
        $form.elements.mail.focus(); return;
      }
      if (d.linkedin && !/^https?:\/\//i.test(d.linkedin)) d.linkedin = "https://" + d.linkedin;

      d.foto = fotoData;
      d.equipamiento = Object.assign({}, q, {
        gestion: val("eq_gestion"), clienteResponsable: val("eq_clienteResponsable"),
        fechaEntrega: val("eq_fechaEntrega"), equipo: val("eq_equipo"),
        nroSerie: val("eq_nroSerie"), estado: val("eq_estado"),
      });

      var next = load();
      if (emp) {
        var i = next.findIndex(function (x) { return x.id === emp.id; });
        next[i] = Object.assign({}, next[i], d, { actualizado: new Date().toISOString() });
        save(next);
        toast("Cambios guardados");
        location.hash = "#/empleado/" + emp.id;
      } else {
        d.id = uid();
        d.creado = new Date().toISOString();
        d.licencias = []; d.seguimientos = []; d.documentos = [];
        d.relacion = {}; d.administracion = {};
        next.push(d);
        save(next);
        toast("Colaborador creado");
        location.hash = "#/empleado/" + d.id;
      }
    });
  }

  /* ---------- Router ---------- */
  function router() {
    var h = location.hash || "#/";
    var mSec = h.match(/^#\/empleado\/([^/]+)\/(doc|adm|editar)$/);
    var mEmp = h.match(/^#\/empleado\/([^/]+)$/);
    if (h === "#/nuevo") vistaEditar(null);
    else if (mSec && mSec[2] === "editar") vistaEditar(mSec[1]);
    else if (mSec) vistaFicha(mSec[1], mSec[2]);
    else if (mEmp) vistaFicha(mEmp[1], "panel");
    else vistaLista();
  }

  window.addEventListener("hashchange", router);
  router();
})();
