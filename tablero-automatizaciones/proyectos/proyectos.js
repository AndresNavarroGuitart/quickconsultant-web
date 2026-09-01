/* Proyectos — espejo de solo lectura del tablero de Notion.
   Datos en proyectos-data.js (window.PROYECTOS_DATA). */
(function () {
  "use strict";

  var THEME_KEY = "nba-tablero-theme";
  var DATA = window.PROYECTOS_DATA || { proyectos: [], sincronizado: null };
  var PROYECTOS = DATA.proyectos || [];

  var ESTADOS = ["Sin Iniciar", "En curso", "Std By", "Finalizado"];
  var ESTADO_COLOR = {
    "Sin Iniciar": "var(--muted)",
    "En curso": "#2f74c0",
    "Std By": "var(--warn)",
    "Finalizado": "var(--ok)",
  };
  var ETAPAS = [
    "0. Semilla", "1. Primer Contacto", "2. Reunión de exploración", "3. Presupuestación",
    "4. Acuerdo", "5. Ejecución de proyecto", "6. Post Implementación",
  ];
  var CLIENTE_COLOR = {
    "Danangie": "#3d7a68", "Ckoos": "#697082", "Criptoservicios": "#3d7a68", "Dropi": "#c8a53a",
    "Evenfire/Palmera": "#3d7a68", "MOSTTO": "#3d7a68", "More Payments": "#697082", "Murchison": "#c0402f",
    "Not A Bot": "#20574e", "Simetrik": "#2f74c0", "TecnoAcción": "#c84e1e", "Uniteller": "#2f74c0",
  };

  var vista = "kanban";
  var F = { q: "", cliente: "", etapa: "", lider: "" };

  var $board = document.getElementById("board");
  var $listaWrap = document.getElementById("listaWrap");
  var $listaBody = document.getElementById("listaBody");
  var $kpis = document.getElementById("kpis");
  var $sync = document.getElementById("sync");
  var $drawer = document.getElementById("drawer");
  var $drawerBody = document.getElementById("drawerBody");
  var $fBuscar = document.getElementById("fBuscar");
  var $fCliente = document.getElementById("fCliente");
  var $fEtapa = document.getElementById("fEtapa");
  var $fLider = document.getElementById("fLider");
  var $fLimpiar = document.getElementById("fLimpiar");

  /* ---------- Tema ---------- */
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

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fecha(s) {
    if (!s) return "—";
    var d = new Date(s + "T00:00:00");
    return isNaN(d) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  }
  function fechaCorta(s) {
    if (!s) return "—";
    var d = new Date(s + "T00:00:00");
    return isNaN(d) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  }
  function relativo(s) {
    if (!s) return "—";
    var d = new Date(s), diff = (Date.now() - d.getTime()) / 1000;
    if (isNaN(d)) return "—";
    if (diff < 3600) return "hace " + Math.max(1, Math.round(diff / 60)) + " min";
    if (diff < 86400) return "hace " + Math.round(diff / 3600) + " h";
    return "hace " + Math.round(diff / 86400) + " d";
  }
  function iniciales(l) { return String(l || "").replace(/^@/, "").slice(0, 3); }
  function etapaCorta(e) { var m = e && e.match(/^(\d+)/); return m ? "Etapa " + m[1] : ""; }
  function dot(color) { return '<span class="col__dot" style="background:' + color + '"></span>'; }
  function opts(arr, sel, placeholder) {
    return '<option value="">' + placeholder + "</option>" +
      arr.map(function (o) { return "<option" + (o === sel ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("");
  }

  /* ---------- Filtros ---------- */
  function visibles() {
    var q = F.q.trim().toLowerCase();
    return PROYECTOS.filter(function (p) {
      if (F.cliente && p.cliente !== F.cliente) return false;
      if (F.etapa && p.etapa !== F.etapa) return false;
      if (F.lider && p.lider !== F.lider) return false;
      if (q && [p.actividad, p.cliente, p.producto, p.stakeholder].join(" ").toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function unicos(campo) {
    return PROYECTOS.map(function (p) { return p[campo]; })
      .filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
  }
  function renderFiltros() {
    $fCliente.innerHTML = opts(unicos("cliente"), F.cliente, "Todos los clientes");
    $fEtapa.innerHTML = opts(ETAPAS.filter(function (e) { return PROYECTOS.some(function (p) { return p.etapa === e; }); }), F.etapa, "Todas las etapas");
    $fLider.innerHTML = opts(unicos("lider"), F.lider, "Todos los líderes");
    $fLimpiar.hidden = !(F.q || F.cliente || F.etapa || F.lider);
  }

  /* ---------- KPIs + sync ---------- */
  function renderSync() {
    $sync.innerHTML =
      "Espejo de <b>" + esc(DATA.fuente || "Notion") + "</b> · sincronizado " +
      esc(relativo(DATA.sincronizado)) + " (" + esc(fecha((DATA.sincronizado || "").slice(0, 10))) + ")" +
      (DATA.notionUrl ? '<a href="' + esc(DATA.notionUrl) + '" target="_blank" rel="noopener">Abrir en Notion ↗</a>' : "");
  }
  function renderKpis() {
    var total = PROYECTOS.length;
    var enCurso = PROYECTOS.filter(function (p) { return p.estado === "En curso"; }).length;
    var stdby = PROYECTOS.filter(function (p) { return p.estado === "Std By"; }).length;
    var fin = PROYECTOS.filter(function (p) { return p.estado === "Finalizado"; }).length;
    var cs = [
      { l: "Proyectos", v: total, h: "en el tablero" },
      { l: "En curso", v: enCurso, h: "activos", accent: true },
      { l: "En pausa (Std By)", v: stdby, h: stdby ? "frenados" : "ninguno" },
      { l: "Finalizados", v: fin, h: "cerrados", accent: true },
    ];
    $kpis.innerHTML = cs.map(function (c) {
      return '<article class="kpi' + (c.accent ? " kpi--accent" : "") + '"><div class="kpi__label">' + c.l +
        '</div><div class="kpi__value">' + c.v + '</div><div class="kpi__hint">' + c.h + "</div></article>";
    }).join("");
  }

  /* ---------- Kanban ---------- */
  function card(p) {
    var cli = CLIENTE_COLOR[p.cliente] || "#697082";
    return '<article class="proj" tabindex="0" data-id="' + esc(p.id) + '" aria-label="Ver ' + esc(p.actividad) + '">' +
      '<div class="proj__top"><span class="tag" style="background:' + cli + '">' + esc(p.cliente) + "</span>" +
        '<span class="proj__etapa">' + esc(etapaCorta(p.etapa) || "—") + "</span></div>" +
      '<div class="proj__nombre">' + esc(p.actividad) + "</div>" +
      (p.producto ? '<div class="proj__cliente">' + esc(p.producto) + "</div>" : "") +
      '<div class="proj__foot"><span class="who"><i>' + esc(iniciales(p.lider)) + "</i>" + esc(p.lider || "—") + "</span>" +
        '<span class="chip-fecha">' + (p.fin ? "fin " + fechaCorta(p.fin) : "sin fecha") + "</span></div>" +
      "</article>";
  }
  function renderKanban() {
    var vis = visibles();
    $board.innerHTML = ESTADOS.map(function (est) {
      var col = vis.filter(function (p) { return p.estado === est; });
      return '<div class="col"><div class="col__head"><div class="col__title">' + dot(ESTADO_COLOR[est]) + esc(est) +
        '<span class="col__count">' + col.length + "</span></div></div>" +
        '<div class="col__body">' + col.map(card).join("") + "</div></div>";
    }).join("");
  }

  /* ---------- Lista ---------- */
  function renderLista() {
    var vis = visibles().slice().sort(function (a, b) {
      return ESTADOS.indexOf(a.estado) - ESTADOS.indexOf(b.estado) || (a.fin || "9999").localeCompare(b.fin || "9999");
    });
    $listaBody.innerHTML = vis.length ? vis.map(function (p) {
      return '<tr tabindex="0" data-id="' + esc(p.id) + '">' +
        '<td class="strong">' + esc(p.actividad) + "</td><td>" + esc(p.cliente) + "</td>" +
        '<td><span class="pill">' + dot(ESTADO_COLOR[p.estado]) + esc(p.estado) + "</span></td>" +
        "<td>" + esc(p.etapa || "—") + "</td><td>" + esc(p.lider || "—") + "</td>" +
        "<td>" + esc(p.producto || "—") + "</td><td>" + fechaCorta(p.fin) + "</td></tr>";
    }).join("") : '<tr><td colspan="7" class="lista-vacia">Ningún proyecto coincide con los filtros.</td></tr>';
  }

  function render() {
    renderKpis();
    if (vista === "kanban") { renderKanban(); $board.hidden = false; $listaWrap.hidden = true; }
    else { renderLista(); $board.hidden = true; $listaWrap.hidden = false; }
  }

  /* ---------- Drawer ---------- */
  function openDrawer(id) {
    var p = PROYECTOS.find(function (x) { return x.id === id; });
    if (!p) return;
    var celdas = [
      ["Cliente", p.cliente], ["Estado", p.estado], ["Etapa", p.etapa || "—"],
      ["Líder interno", p.lider || "—"], ["Stakeholder", p.stakeholder || "—"],
      ["Inicio", fecha(p.inicio)], ["Fin", fecha(p.fin)],
    ];
    $drawerBody.innerHTML =
      '<span class="d-estado">' + dot(ESTADO_COLOR[p.estado]) + esc(p.estado) + "</span>" +
      '<h2 id="dTitle">' + esc(p.actividad) + '</h2><p class="cliente">' + esc(p.cliente) + "</p>" +
      '<dl class="d-grid">' +
        celdas.map(function (c) { return '<div class="d-cell"><dt>' + c[0] + "</dt><dd>" + esc(c[1]) + "</dd></div>"; }).join("") +
        (p.producto ? '<div class="d-cell wide"><dt>Producto / Servicio</dt><dd>' + esc(p.producto) + "</dd></div>" : "") +
      "</dl>" +
      (p.url ? '<a class="btn" href="' + esc(p.url) + '" target="_blank" rel="noopener">Abrir en Notion ↗</a>' : "");
    $drawer.hidden = false;
    document.body.style.overflow = "hidden";
    $drawer.querySelector(".drawer__close").focus();
  }
  function closeDrawer() { $drawer.hidden = true; document.body.style.overflow = ""; }
  $drawer.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeDrawer(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$drawer.hidden) closeDrawer(); });

  $board.addEventListener("click", function (e) { var c = e.target.closest(".proj"); if (c) openDrawer(c.dataset.id); });
  $board.addEventListener("keydown", function (e) { if (e.key !== "Enter") return; var c = e.target.closest(".proj"); if (c) openDrawer(c.dataset.id); });
  $listaBody.addEventListener("click", function (e) { var r = e.target.closest("tr"); if (r && r.dataset.id) openDrawer(r.dataset.id); });
  $listaBody.addEventListener("keydown", function (e) { if (e.key !== "Enter") return; var r = e.target.closest("tr"); if (r && r.dataset.id) { e.preventDefault(); openDrawer(r.dataset.id); } });

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

  function aplicar() { renderFiltros(); render(); }
  var deb;
  $fBuscar.addEventListener("input", function () { F.q = this.value; clearTimeout(deb); deb = setTimeout(aplicar, 150); });
  $fCliente.addEventListener("change", function () { F.cliente = this.value; aplicar(); });
  $fEtapa.addEventListener("change", function () { F.etapa = this.value; aplicar(); });
  $fLider.addEventListener("change", function () { F.lider = this.value; aplicar(); });
  $fLimpiar.addEventListener("click", function () {
    F = { q: "", cliente: "", etapa: "", lider: "" };
    $fBuscar.value = ""; aplicar();
  });

  renderSync();
  renderFiltros();
  render();
})();
