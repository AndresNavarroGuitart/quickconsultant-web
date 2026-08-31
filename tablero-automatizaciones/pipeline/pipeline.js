/* Pipeline de Clientes — seguimiento de leads
   Persistencia: localStorage. Sin backend. */
(function () {
  "use strict";

  var KEY = "nba-pipeline-leads";
  var THEME_KEY = "nba-tablero-theme";
  var HOY = new Date(); HOY.setHours(0, 0, 0, 0);

  var STAGES = [
    { id: "nuevo", label: "Nuevo", prob: 0.10 },
    { id: "contactado", label: "Contactado", prob: 0.25 },
    { id: "calificado", label: "Calificado", prob: 0.45 },
    { id: "propuesta", label: "Propuesta enviada", prob: 0.65 },
    { id: "negociacion", label: "Negociación", prob: 0.80 },
    { id: "ganado", label: "Ganado", prob: 1.00 },
    { id: "perdido", label: "Perdido", prob: 0 },
  ];
  var STAGE = {}; STAGES.forEach(function (s) { STAGE[s.id] = s; });
  var CERRADAS = { ganado: 1, perdido: 1 };

  var SERVICIOS = {
    "Externalización de talento": "#03524e",
    "Contratación directa": "#c84e1e",
    "Transformación digital": "#cc3366",
  };
  var ORIGENES = ["Web", "Referido", "LinkedIn", "Evento", "Outbound", "Otro"];
  var MOTIVOS = ["Precio", "Timing", "Competidor", "Sin respuesta", "Presupuesto", "Otro"];
  var TIPOS_ACT = ["Llamada", "Email", "Reunión", "WhatsApp", "Nota"];
  var MONEDAS = ["USD", "EUR", "ARS", "UYU", "MXN", "COP", "CLP"];
  var RATE = { USD: 1, EUR: 1.08 };

  function usd(l) { return (l.valor || 0) * (RATE[l.moneda] || 1); }
  function money(n, m) { return (m || "USD") + " " + Math.round(n).toLocaleString("es-AR"); }
  function iniciales(nombre) { return String(nombre).split(" ").map(function (p) { return p.charAt(0); }).slice(0, 2).join("").toUpperCase() || "?"; }
  function fechaCorta(s) {
    if (!s) return "—";
    var d = new Date(s + "T00:00:00");
    return isNaN(d) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  }
  function hoyISO() { return new Date().toISOString().slice(0, 10); }
  function esVencida(l) {
    if (CERRADAS[l.etapa] || !l.proximaFecha) return false;
    return new Date(l.proximaFecha + "T00:00:00") < HOY;
  }
  function ultimoContacto(l) {
    var a = (l.actividad || []).slice().sort(function (x, y) { return y.fecha.localeCompare(x.fecha); })[0];
    return a ? a.fecha : null;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function toast(m) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = m;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400);
  }
  function opciones(arr, sel) {
    return arr.map(function (o) { return "<option" + (o === sel ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("");
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw === null && Array.isArray(window.PIPELINE_DEMO)) {
        localStorage.setItem(KEY, JSON.stringify(window.PIPELINE_DEMO));
        return JSON.parse(JSON.stringify(window.PIPELINE_DEMO));
      }
      return JSON.parse(raw) || [];
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(leads)); } catch (e) {} }

  var leads = load();
  var vista = "kanban";
  var filtroResp = "";

  var $board = document.getElementById("board");
  var $listaWrap = document.getElementById("listaWrap");
  var $listaBody = document.getElementById("listaBody");
  var $kpis = document.getElementById("kpis");
  var $drawer = document.getElementById("drawer");
  var $drawerBody = document.getElementById("drawerBody");
  var $filtroResp = document.getElementById("filtroResp");

  /* ---------- Tema (compartido con el tablero) ---------- */
  (function () {
    var s; try { s = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (s === "dark" || s === "light") document.documentElement.setAttribute("data-theme", s);
    document.getElementById("themeToggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var pd = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var nx = cur ? (cur === "dark" ? "light" : "dark") : (pd ? "light" : "dark");
      document.documentElement.setAttribute("data-theme", nx);
      try { localStorage.setItem(THEME_KEY, nx); } catch (e) {}
    });
  })();

  function visibles() {
    return leads.filter(function (l) { return !filtroResp || l.responsable === filtroResp; });
  }

  function renderFiltro() {
    var resp = leads.map(function (l) { return l.responsable; })
      .filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
    $filtroResp.innerHTML = '<option value="">Todos los responsables</option>' +
      resp.map(function (r) { return "<option" + (r === filtroResp ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("");
  }

  function renderKpis() {
    var abiertos = leads.filter(function (l) { return !CERRADAS[l.etapa]; });
    var total = abiertos.reduce(function (s, l) { return s + usd(l); }, 0);
    var pond = abiertos.reduce(function (s, l) { return s + usd(l) * STAGE[l.etapa].prob; }, 0);
    var venc = abiertos.filter(esVencida).length;
    var cerrados = leads.filter(function (l) { return CERRADAS[l.etapa]; });
    var ganados = leads.filter(function (l) { return l.etapa === "ganado"; }).length;
    var conv = cerrados.length ? Math.round(ganados / cerrados.length * 100) : 0;

    var cards = [
      { l: "Pipeline abierto", v: "≈ " + money(total, "USD"), h: abiertos.length + " leads activos", accent: true },
      { l: "Pipeline ponderado", v: "≈ " + money(pond, "USD"), h: "valor × probabilidad de etapa" },
      { l: "Seguimientos vencidos", v: venc, h: venc ? "revisar próximas acciones" : "todo al día", alert: venc > 0 },
      { l: "Conversión", v: conv + "%", h: ganados + " ganados / " + cerrados.length + " cerrados", accent: true },
    ];
    $kpis.innerHTML = cards.map(function (c) {
      return '<article class="kpi' + (c.accent ? " kpi--accent" : "") + (c.alert ? " kpi--alert" : "") + '">' +
        '<div class="kpi__label">' + c.l + '</div><div class="kpi__value">' + c.v + '</div><div class="kpi__hint">' + c.h + "</div></article>";
    }).join("");
  }

  function leadCard(l) {
    var venc = esVencida(l);
    var chip;
    if (l.etapa === "ganado") chip = '<span class="next next--won">Ganado</span>';
    else if (l.etapa === "perdido") chip = '<span class="next next--lost">' + esc(l.motivoPerdida || "Perdido") + "</span>";
    else if (l.proximaFecha) chip = '<span class="next' + (venc ? " next--overdue" : "") + '">' + (venc ? "⚠ " : "") + fechaCorta(l.proximaFecha) + "</span>";
    else chip = '<span class="next">sin próx. acción</span>';
    return '<article class="lead" draggable="true" tabindex="0" data-id="' + esc(l.id) + '" aria-label="Ver ' + esc(l.contacto) + '">' +
      '<div class="lead__top"><span class="tag" style="background:' + (SERVICIOS[l.servicio] || "#697082") + '">' + esc((l.servicio || "").split(" ")[0]) + "</span>" +
        '<span class="lead__valor">' + money(l.valor, l.moneda) + "</span></div>" +
      '<div><div class="lead__contacto">' + esc(l.contacto) + '</div><div class="lead__empresa">' + esc(l.empresa) + "</div></div>" +
      '<div class="lead__foot"><span class="who"><i>' + esc(iniciales(l.responsable)) + "</i>" + esc(String(l.responsable).split(" ")[0]) + "</span>" + chip + "</div>" +
      "</article>";
  }

  function renderKanban() {
    var vis = visibles();
    $board.innerHTML = STAGES.map(function (s) {
      var col = vis.filter(function (l) { return l.etapa === s.id; });
      var tot = col.reduce(function (a, l) { return a + usd(l); }, 0);
      var mod = s.id === "ganado" ? " col--ganado" : s.id === "perdido" ? " col--perdido" : "";
      return '<div class="col' + mod + '">' +
        '<div class="col__head"><div class="col__title">' + esc(s.label) + '<span class="col__count">' + col.length + "</span></div>" +
          '<div class="col__total">≈ ' + money(tot, "USD") + "</div></div>" +
        '<div class="col__body" data-stage="' + s.id + '">' + col.map(leadCard).join("") + "</div></div>";
    }).join("");
    wireDnD();
  }

  function renderLista() {
    var vis = visibles().slice().sort(function (a, b) {
      return (a.proximaFecha || "9999").localeCompare(b.proximaFecha || "9999");
    });
    $listaBody.innerHTML = vis.map(function (l) {
      var venc = esVencida(l);
      var uc = ultimoContacto(l);
      return '<tr tabindex="0" data-id="' + esc(l.id) + '"' + (venc ? ' class="row-overdue"' : "") + ">" +
        '<td class="strong">' + esc(l.contacto) + "</td><td>" + esc(l.empresa) + "</td>" +
        '<td><span class="pill">' + esc(STAGE[l.etapa].label) + "</span></td>" +
        '<td class="num">' + money(l.valor, l.moneda) + "</td>" +
        "<td>" + (CERRADAS[l.etapa] ? "—" : (l.proximaAccion ? (venc ? "⚠ " : "") + esc(l.proximaAccion) + " · " + fechaCorta(l.proximaFecha) : "—")) + "</td>" +
        "<td>" + (uc ? fechaCorta(uc) : "—") + "</td><td>" + esc(l.responsable) + "</td></tr>";
    }).join("");
  }

  function render() {
    renderKpis();
    if (vista === "kanban") { renderKanban(); $board.hidden = false; $listaWrap.hidden = true; }
    else { renderLista(); $board.hidden = true; $listaWrap.hidden = false; }
    save();
  }

  /* ---------- Drag & drop ---------- */
  function wireDnD() {
    var dragId = null;
    function cleanHover() { $board.querySelectorAll(".col__body").forEach(function (b) { b.classList.remove("drop-hover"); }); }
    $board.querySelectorAll(".lead").forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        dragId = card.dataset.id; card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", dragId); } catch (x) {}
      });
      card.addEventListener("dragend", function () { card.classList.remove("dragging"); dragId = null; cleanHover(); });
    });
    $board.querySelectorAll(".col__body").forEach(function (body) {
      body.addEventListener("dragover", function (e) { e.preventDefault(); body.classList.add("drop-hover"); });
      body.addEventListener("dragleave", function () { body.classList.remove("drop-hover"); });
      body.addEventListener("drop", function (e) {
        e.preventDefault(); cleanHover();
        var id = dragId || (e.dataTransfer && e.dataTransfer.getData("text/plain"));
        var l = leads.find(function (x) { return x.id === id; });
        if (!l || l.etapa === body.dataset.stage) return;
        moverEtapa(l, body.dataset.stage);
        toast(l.contacto + " → " + STAGE[l.etapa].label);
        render();
      });
    });
  }
  function moverEtapa(l, etapa) {
    l.etapa = etapa;
    if (CERRADAS[etapa]) { l.proximaAccion = ""; l.proximaFecha = ""; }
    if (etapa === "perdido" && !l.motivoPerdida) l.motivoPerdida = "Sin especificar";
  }

  /* ---------- Drawer: ficha del lead ---------- */
  function openDrawer(id) {
    var l = leads.find(function (x) { return x.id === id; });
    if (!l) return;
    var campos = [
      ["Empresa", l.empresa], ["Mail", l.email], ["Teléfono", l.telefono], ["Origen", l.origen],
      ["Servicio", l.servicio], ["Valor", money(l.valor, l.moneda)],
      ["Probabilidad", Math.round(STAGE[l.etapa].prob * 100) + "%"], ["Responsable", l.responsable],
    ];
    var acts = (l.actividad || []).slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).map(function (a) {
      return '<li class="act"><b>' + esc(a.tipo) + '</b><time>' + fechaCorta(a.fecha) + "</time>" + esc(a.detalle) + "</li>";
    }).join("") || '<li class="act">Sin actividad registrada.</li>';

    $drawerBody.innerHTML =
      '<span class="d-stage" style="background:' + (l.etapa === "ganado" ? "var(--ok)" : l.etapa === "perdido" ? "var(--stop)" : (SERVICIOS[l.servicio] || "#697082")) + '">' + esc(STAGE[l.etapa].label) + "</span>" +
      '<h2 id="dTitle">' + esc(l.contacto) + '</h2><p class="empresa">' + esc(l.empresa) + "</p>" +
      '<dl class="d-grid">' + campos.map(function (c) { return '<div class="d-cell"><dt>' + c[0] + "</dt><dd>" + esc(c[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<div class="d-sec"><h3>Etapa</h3>' +
        '<div class="field"><span>Mover a</span><select id="mv">' +
          STAGES.map(function (s) { return '<option value="' + s.id + '"' + (s.id === l.etapa ? " selected" : "") + ">" + esc(s.label) + "</option>"; }).join("") + "</select></div>" +
        (l.etapa === "perdido" ? '<div class="field"><span>Motivo de pérdida</span><select id="motivo">' + opciones(MOTIVOS, l.motivoPerdida) + "</select></div>" : "") +
      "</div>" +
      (CERRADAS[l.etapa] ? "" :
        '<div class="d-sec"><h3>Seguimiento</h3><div class="row2">' +
          '<div class="field"><span>Próxima acción</span><input id="pa" value="' + esc(l.proximaAccion || "") + '" placeholder="Ej: llamar al decisor" /></div>' +
          '<div class="field"><span>Fecha</span><input id="pf" type="date" value="' + esc(l.proximaFecha || "") + '" /></div>' +
        '</div><button class="btn" id="savePA" type="button">Guardar seguimiento</button></div>') +
      '<div class="d-sec"><h3>Actividad</h3><ul class="acts">' + acts + "</ul>" +
        '<div class="d-form-row">' +
          '<select id="aTipo">' + opciones(TIPOS_ACT) + "</select>" +
          '<input id="aDet" placeholder="Qué pasó…" />' +
          '<button class="btn" id="aAdd" type="button">Registrar</button>' +
        "</div></div>" +
      '<div class="d-actions"><button class="d-del" id="delLead" type="button">Eliminar lead</button></div>';

    document.getElementById("mv").addEventListener("change", function () {
      moverEtapa(l, this.value); render(); openDrawer(id);
    });
    var mot = document.getElementById("motivo");
    if (mot) mot.addEventListener("change", function () { l.motivoPerdida = this.value; render(); });
    var sp = document.getElementById("savePA");
    if (sp) sp.addEventListener("click", function () {
      l.proximaAccion = document.getElementById("pa").value.trim();
      l.proximaFecha = document.getElementById("pf").value;
      toast("Seguimiento actualizado"); render(); openDrawer(id);
    });
    document.getElementById("aAdd").addEventListener("click", function () {
      var det = document.getElementById("aDet").value.trim();
      if (!det) { toast("Escribí qué pasó"); return; }
      l.actividad = l.actividad || [];
      l.actividad.push({ fecha: hoyISO(), tipo: document.getElementById("aTipo").value, detalle: det });
      toast("Actividad registrada"); render(); openDrawer(id);
    });
    document.getElementById("delLead").addEventListener("click", function () {
      if (!confirm("¿Eliminar el lead de " + l.contacto + " (" + l.empresa + ")?")) return;
      leads = leads.filter(function (x) { return x.id !== l.id; });
      renderFiltro(); render(); closeDrawer(); toast("Lead eliminado");
    });

    $drawer.hidden = false;
    document.body.style.overflow = "hidden";
    $drawer.querySelector(".drawer__close").focus();
  }

  /* ---------- Drawer: nuevo lead ---------- */
  function openNuevo() {
    $drawerBody.innerHTML =
      '<span class="d-stage" style="background:var(--teal)">Nuevo lead</span><h2 id="dTitle">Alta de lead</h2>' +
      '<form id="nuevoForm">' +
        '<div class="field"><span>Contacto <b>*</b></span><input name="contacto" required /></div>' +
        '<div class="field"><span>Empresa <b>*</b></span><input name="empresa" required /></div>' +
        '<div class="row2"><div class="field"><span>Mail</span><input name="email" type="email" /></div>' +
          '<div class="field"><span>Teléfono</span><input name="telefono" /></div></div>' +
        '<div class="row2"><div class="field"><span>Origen</span><select name="origen">' + opciones(ORIGENES) + "</select></div>" +
          '<div class="field"><span>Servicio</span><select name="servicio">' + opciones(Object.keys(SERVICIOS)) + "</select></div></div>" +
        '<div class="row2"><div class="field"><span>Valor estimado</span><input name="valor" type="number" min="0" step="100" /></div>' +
          '<div class="field"><span>Moneda</span><select name="moneda">' + opciones(MONEDAS, "USD") + "</select></div></div>" +
        '<div class="row2"><div class="field"><span>Etapa</span><select name="etapa">' +
          STAGES.filter(function (s) { return !CERRADAS[s.id]; }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.label) + "</option>"; }).join("") + "</select></div>" +
          '<div class="field"><span>Responsable <b>*</b></span><input name="responsable" required /></div></div>' +
        '<div class="row2"><div class="field"><span>Próxima acción</span><input name="proximaAccion" /></div>' +
          '<div class="field"><span>Fecha</span><input name="proximaFecha" type="date" /></div></div>' +
        '<p class="form-error" id="nErr" hidden></p>' +
        '<div class="d-actions"><button class="btn" type="submit">Crear lead</button>' +
          '<button class="btn btn--ghost" type="button" data-close>Cancelar</button></div>' +
      "</form>";

    document.getElementById("nuevoForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      var $e = document.getElementById("nErr");
      var req = ["contacto", "empresa", "responsable"].filter(function (k) { return !f[k].value.trim(); });
      if (req.length) { $e.hidden = false; $e.textContent = "Completá: " + req.join(", "); return; }
      var lead = {
        id: uid(), contacto: f.contacto.value.trim(), empresa: f.empresa.value.trim(),
        email: f.email.value.trim(), telefono: f.telefono.value.trim(),
        origen: f.origen.value, servicio: f.servicio.value,
        valor: Number(f.valor.value) || 0, moneda: f.moneda.value,
        etapa: f.etapa.value, responsable: f.responsable.value.trim(),
        proximaAccion: f.proximaAccion.value.trim(), proximaFecha: f.proximaFecha.value,
        creado: hoyISO(), actividad: [],
      };
      leads.push(lead);
      renderFiltro(); render(); toast("Lead creado");
      openDrawer(lead.id);
    });

    $drawer.hidden = false;
    document.body.style.overflow = "hidden";
    $drawer.querySelector(".drawer__close").focus();
  }

  function closeDrawer() { $drawer.hidden = true; document.body.style.overflow = ""; }
  $drawer.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeDrawer(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$drawer.hidden) closeDrawer(); });

  $board.addEventListener("click", function (e) { var c = e.target.closest(".lead"); if (c) openDrawer(c.dataset.id); });
  $board.addEventListener("keydown", function (e) { if (e.key !== "Enter") return; var c = e.target.closest(".lead"); if (c) openDrawer(c.dataset.id); });
  $listaBody.addEventListener("click", function (e) { var r = e.target.closest("tr"); if (r) openDrawer(r.dataset.id); });
  $listaBody.addEventListener("keydown", function (e) { if (e.key !== "Enter") return; var r = e.target.closest("tr"); if (r) { e.preventDefault(); openDrawer(r.dataset.id); } });

  /* ---------- Toolbar ---------- */
  function setVista(v) {
    vista = v;
    var k = document.getElementById("v-kanban"), li = document.getElementById("v-lista");
    k.classList.toggle("is-active", v === "kanban"); li.classList.toggle("is-active", v === "lista");
    k.setAttribute("aria-selected", v === "kanban"); li.setAttribute("aria-selected", v === "lista");
    render();
  }
  document.getElementById("v-kanban").addEventListener("click", function () { setVista("kanban"); });
  document.getElementById("v-lista").addEventListener("click", function () { setVista("lista"); });
  $filtroResp.addEventListener("change", function () { filtroResp = this.value; render(); });
  document.getElementById("btnNuevo").addEventListener("click", openNuevo);

  renderFiltro();
  render();
})();
