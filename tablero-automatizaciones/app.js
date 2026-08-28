/* Tablero de Automatizaciones — lógica de UI */
(function () {
  "use strict";

  var DATA = window.TABLERO || { procesos: [], categorias: {}, actualizado: null };
  var CATS = DATA.categorias || {};

  var state = { estado: "todos", q: "" };

  var $grid = document.getElementById("grid");
  var $empty = document.getElementById("empty");
  var $kpis = document.getElementById("kpis");
  var $search = document.getElementById("search");
  var $filters = document.getElementById("filters");
  var $updated = document.getElementById("updated");
  var $drawer = document.getElementById("drawer");
  var $drawerBody = document.getElementById("drawerBody");

  var ESTADO_LABEL = { operativo: "Operativo", atencion: "Atención", detenido: "Detenido" };

  /* ---------- Utilidades de fecha ---------- */
  function parseDate(s) { return s ? new Date(s) : null; }

  function relativo(s) {
    var d = parseDate(s);
    if (!d || isNaN(d)) return "—";
    var diff = (Date.now() - d.getTime()) / 1000;
    var abs = Math.abs(diff);
    var fut = diff < 0;
    var out;
    if (abs < 60) out = "hace instantes";
    else if (abs < 3600) out = Math.round(abs / 60) + " min";
    else if (abs < 86400) out = "hace " + Math.round(abs / 3600) + " h";
    else if (abs < 86400 * 7) out = "hace " + Math.round(abs / 86400) + " d";
    else out = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    if (abs >= 60 && abs < 3600) out = "hace " + out;
    return fut ? out.replace("hace ", "en ") : out;
  }

  function fechaLarga(s) {
    var d = parseDate(s);
    if (!d || isNaN(d)) return "—";
    return d.toLocaleString("es-AR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var p = DATA.procesos;
    var activos = p.filter(function (x) { return x.estado !== "detenido"; }).length;
    var ejec = p.reduce(function (a, x) { return a + (x.ejecuciones7d || 0); }, 0);
    var conExito = p.filter(function (x) { return x.estado !== "detenido"; });
    var exitoProm = conExito.length
      ? Math.round(conExito.reduce(function (a, x) { return a + (x.exito7d || 0); }, 0) / conExito.length)
      : 0;
    var incidencias = p.filter(function (x) { return x.estado === "atencion" || x.estado === "detenido"; }).length;

    var cards = [
      { label: "Procesos activos", value: activos, hint: "de " + p.length + " en total", accent: true },
      { label: "Ejecuciones (7 días)", value: ejec, hint: "todas las automatizaciones" },
      { label: "Tasa de éxito (7 días)", value: exitoProm, unit: "%", hint: "promedio de procesos activos", accent: true },
      { label: "Requieren atención", value: incidencias, hint: incidencias === 0 ? "todo en verde" : "revisar detalle" },
    ];

    $kpis.innerHTML = cards.map(function (c) {
      return (
        '<article class="kpi' + (c.accent ? " kpi--accent" : "") + '">' +
        '<div class="kpi__label">' + c.label + "</div>" +
        '<div class="kpi__value">' + c.value + (c.unit ? "<small>" + c.unit + "</small>" : "") + "</div>" +
        '<div class="kpi__hint">' + c.hint + "</div>" +
        "</article>"
      );
    }).join("");
  }

  /* ---------- Tarjetas ---------- */
  function matches(proc) {
    if (state.estado !== "todos" && proc.estado !== state.estado) return false;
    if (!state.q) return true;
    var hay = (
      proc.nombre + " " +
      (CATS[proc.categoria] ? CATS[proc.categoria].label : "") + " " +
      (proc.responsable || "") + " " +
      (proc.descripcion || "")
    ).toLowerCase();
    return hay.indexOf(state.q) !== -1;
  }

  function catStyle(catKey) {
    var c = CATS[catKey];
    return c ? 'style="background:' + c.color + '"' : "";
  }

  function cardHTML(proc) {
    var cat = CATS[proc.categoria] || { label: proc.categoria };
    var esModulo = !!proc.enlace;
    var open = esModulo
      ? '<a class="card card--modulo" href="' + escapeAttr(proc.enlace) + '" data-id="' + proc.id + '" ' +
        'aria-label="Abrir ' + escapeAttr(proc.nombre) + '">'
      : '<article class="card" tabindex="0" role="button" data-id="' + proc.id + '" ' +
        'aria-label="Ver detalle de ' + escapeAttr(proc.nombre) + '">';
    return (
      open +
        '<div class="card__top">' +
          '<span class="card__cat" ' + catStyle(proc.categoria) + ">" + cat.label + "</span>" +
          '<span class="card__status"><i class="dot dot--' + proc.estado + '"></i>' + ESTADO_LABEL[proc.estado] + "</span>" +
        "</div>" +
        '<h3 class="card__title">' + proc.nombre + "</h3>" +
        '<p class="card__desc">' + proc.descripcion + "</p>" +
        '<dl class="card__meta">' +
          "<div><dt>Última corrida</dt><dd>" + relativo(proc.ultimaEjecucion) + "</dd></div>" +
          "<div><dt>Frecuencia</dt><dd>" + (proc.frecuencia || "—") + "</dd></div>" +
          "<div><dt>Éxito 7d</dt><dd>" + (proc.estado === "detenido" ? "—" : (proc.exito7d + "%")) + "</dd></div>" +
        "</dl>" +
        (esModulo ? '<span class="card__go">Abrir módulo <span aria-hidden="true">→</span></span>' : "") +
      (esModulo ? "</a>" : "</article>")
    );
  }

  function render() {
    var list = DATA.procesos.filter(matches);
    $grid.innerHTML = list.map(cardHTML).join("");
    $empty.hidden = list.length !== 0;
  }

  /* ---------- Drawer ---------- */
  function openDrawer(id) {
    var proc = DATA.procesos.find(function (x) { return x.id === id; });
    if (!proc) return;
    var cat = CATS[proc.categoria] || { label: proc.categoria, color: "#697082" };

    var stats = [
      ["Estado", ESTADO_LABEL[proc.estado]],
      ["Última ejecución", relativo(proc.ultimaEjecucion)],
      ["Frecuencia", proc.frecuencia || "—"],
      ["Duración media", proc.duracionMedia || "—"],
      ["Éxito (7 días)", proc.estado === "detenido" ? "—" : proc.exito7d + "%"],
      ["Ejecuciones (7 días)", proc.ejecuciones7d != null ? proc.ejecuciones7d : "—"],
      ["Responsable", proc.responsable || "—"],
      ["Categoría", cat.label],
    ];

    var runs = (proc.corridas || []).map(function (r) {
      var badge = r.estado === "ok" ? "ok" : (r.estado === "error" ? "error" : "aviso");
      var txt = r.estado === "ok" ? "OK" : (r.estado === "error" ? "Error" : "Aviso");
      return (
        '<li class="run">' +
          '<span class="run__badge run__badge--' + badge + '">' + txt + "</span>" +
          '<span class="run__when">' + fechaLarga(r.fecha) + "</span>" +
          '<span class="run__detalle">' + r.detalle + "</span>" +
        "</li>"
      );
    }).join("");

    $drawerBody.innerHTML =
      '<div class="detail">' +
        '<span class="detail__cat" style="background:' + cat.color + '">' + cat.label + "</span>" +
        '<h2 id="drawerTitle">' + proc.nombre + "</h2>" +
        '<p class="detail__desc">' + proc.descripcion + "</p>" +
        '<dl class="detail__stats">' +
          stats.map(function (s) {
            return '<div class="detail__stat"><dt>' + s[0] + "</dt><dd>" + s[1] + "</dd></div>";
          }).join("") +
        "</dl>" +
        "<h3>Últimas corridas</h3>" +
        (runs ? '<ul class="runs">' + runs + "</ul>" : '<p class="detail__desc">Sin registros todavía.</p>') +
        (proc.enlace
          ? '<a class="btn" href="' + proc.enlace + '">Abrir herramienta →</a>'
          : '<span class="btn btn--ghost">Sin interfaz asociada</span>') +
      "</div>";

    $drawer.hidden = false;
    document.body.style.overflow = "hidden";
    var closeBtn = $drawer.querySelector(".drawer__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    $drawer.hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- Helpers ---------- */
  function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }

  /* ---------- Tema ---------- */
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem("nba-tablero-theme"); } catch (e) {}
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    var btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = cur ? (cur === "dark" ? "light" : "dark") : (prefersDark ? "light" : "dark");
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("nba-tablero-theme", next); } catch (e) {}
    });
  }

  /* ---------- Eventos ---------- */
  $search.addEventListener("input", function () {
    state.q = this.value.trim().toLowerCase();
    render();
  });

  $filters.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    state.estado = btn.dataset.estado;
    $filters.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === btn); });
    render();
  });

  $grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (!card || card.tagName === "A") return; // los módulos navegan solos
    openDrawer(card.dataset.id);
  });
  $grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".card");
    if (!card || card.tagName === "A") return;
    e.preventDefault();
    openDrawer(card.dataset.id);
  });

  $drawer.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeDrawer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !$drawer.hidden) closeDrawer();
  });

  /* ---------- Init ---------- */
  initTheme();
  if ($updated && DATA.actualizado) {
    $updated.textContent = "Actualizado " + relativo(DATA.actualizado);
    $updated.title = fechaLarga(DATA.actualizado);
  }
  renderKpis();
  render();
})();
