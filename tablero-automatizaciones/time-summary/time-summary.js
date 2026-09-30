/* Time Summary — carga de horas trabajadas por colaborador. Dos solapas:
   Colaborador (Carga de hs + Carga on line + Resumen con todo su historial)
   y Administración (vista RRHH de quién cargó + envío del resumen mensual).
   Persistencia en localStorage, sin backend. El envío del resumen mensual va
   a un Google Form/Sheet privado de RRHH (config pendiente, ver SETUP.md) —
   no se guarda ningún dato de terceros en este repo. */
(function () {
  "use strict";

  var STORE_KEY = "nba-timesummary-entries";
  var TEMPLATES_KEY = "nba-timesummary-plantillas";
  var COLAB_KEY = "nba-timesummary-colaborador";
  var RUNNING_KEY = "nba-timesummary-running";
  var THEME_KEY = "nba-tablero-theme";
  var $app = document.getElementById("app");

  /* ---------- CONFIG — completar según SETUP.md antes de usar "Enviar resumen" ---------- */
  var CONFIG = {
    formActionUrl: "REEMPLAZAR_CON_LA_URL_DE_FORMRESPONSE",
    entryIds: {
      mes: "REEMPLAZAR_entry_id",
      colaborador: "REEMPLAZAR_entry_id",
      horas: "REEMPLAZAR_entry_id",
    },
  };
  function isPlaceholder(v) { return !v || v.indexOf("REEMPLAZAR") === 0; }

  /* ---------- Tema ---------- */
  (function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
    var btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = cur ? (cur === "dark" ? "light" : "dark") : (prefersDark ? "light" : "dark");
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  })();

  /* ---------- Helpers ---------- */
  function tpl(id) { return document.getElementById(id).content.cloneNode(true); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function uid() { return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function loadJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { alert("No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado."); }
  }
  function loadEntries() { return loadJSON(STORE_KEY, null) || (Array.isArray(window.TIME_ENTRIES_DEMO) ? window.TIME_ENTRIES_DEMO.slice() : []); }
  function saveEntries(list) { saveJSON(STORE_KEY, list); }

  /* ---------- Fechas ---------- */
  function isoDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parseISO(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function mondayOf(d) {
    var day = d.getDay(); // 0=domingo
    var diff = day === 0 ? -6 : 1 - day;
    return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), diff);
  }
  function fechaCorta(d) {
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).replace(".", "");
  }
  function diaCorto(d) {
    return d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");
  }
  function diaLargo(d) {
    var s = d.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "short" });
    return s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
  }
  function horasFmt(h) {
    var v = Math.round((Number(h) || 0) * 100) / 100;
    if (v === 0) return "0:00";
    var horas = Math.floor(v);
    var min = Math.round((v - horas) * 60);
    if (min === 60) { horas++; min = 0; }
    return horas + ":" + String(min).padStart(2, "0");
  }
  function segFmt(seg) {
    var h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = Math.floor(seg % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  function parseHorasInput(v) {
    if (!v) return 0;
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : Math.max(0, Math.min(24, n));
  }
  function horasEntreHM(inicio, fin) {
    var a = inicio.split(":"), b = fin.split(":");
    var min = (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]);
    if (min < 0) min += 24 * 60;
    return min / 60;
  }

  /* ---------- Colaboradores (desde Nómina) ---------- */
  function loadColaboradores() {
    var raw = loadJSON("nba-nomina-empleados", null) || window.NOMINA_DEMO || [];
    return raw.filter(function (e) { return e.estado === "Activo"; }).map(function (e) {
      return {
        id: e.id,
        nombre: ((e.nombre || "") + " " + (e.apellido || "")).trim(),
        cliente: e.cliente || "",
        proyecto: e.proyecto || "",
      };
    });
  }
  function proyectoDefault(colab) {
    if (!colab) return "Interno";
    var s = [colab.cliente, colab.proyecto].filter(Boolean).join(" / ");
    return s || "Interno";
  }
  function proyectosDe(colabId) {
    var colab = COLABORADORES.filter(function (c) { return c.id === colabId; })[0];
    var set = {};
    set[proyectoDefault(colab)] = true;
    set["Interno"] = true;
    ENTRIES.filter(function (e) { return e.colaboradorId === colabId; }).forEach(function (e) { if (e.proyecto) set[e.proyecto] = true; });
    (loadJSON(TEMPLATES_KEY, {})[colabId] || []).forEach(function (p) { if (p) set[p] = true; });
    return Object.keys(set);
  }
  function populateSelect($sel, opciones, valorActual) {
    $sel.innerHTML = opciones.map(function (o) {
      return "<option" + (o === valorActual ? " selected" : "") + ">" + esc(o) + "</option>";
    }).join("");
  }

  /* ---------- Estado global del módulo ---------- */
  var COLABORADORES = [];
  var ENTRIES = [];
  var planWeekStart = mondayOf(new Date());
  var trkTimerHandle = null;
  var adminPeriodo = "semana"; // "semana" | "mes"
  var adminWeekStart = mondayOf(new Date());
  var adminMonth = (function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
  var adminSoloFaltan = false;

  function colaboradorActual() {
    var id = document.getElementById("tsColaborador").value;
    return COLABORADORES.filter(function (c) { return c.id === id; })[0] || null;
  }

  /* ================= Shell + router ================= */
  function renderShell() {
    $app.innerHTML = "";
    $app.appendChild(tpl("tpl-shell"));
    COLABORADORES = loadColaboradores();
    ENTRIES = loadEntries();

    var $colab = document.getElementById("tsColaborador");
    var savedId = loadJSON(COLAB_KEY, null);
    $colab.innerHTML = COLABORADORES.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.nombre) + "</option>";
    }).join("");
    if (savedId && COLABORADORES.some(function (c) { return c.id === savedId; })) $colab.value = savedId;
    $colab.addEventListener("change", function () {
      saveJSON(COLAB_KEY, $colab.value);
      renderView(currentRoute());
    });

    router();
  }

  function currentRoute() {
    var h = location.hash.replace(/^#\//, "");
    var parts = h.split("/");
    if (parts[0] === "admin") return { primary: "admin", sub: null };
    var sub = parts[1];
    if (sub !== "carga-hs" && sub !== "carga-online" && sub !== "resumen") sub = "carga-hs";
    return { primary: "colaborador", sub: sub };
  }

  function router() { renderView(currentRoute()); }

  function renderView(route) {
    var primaryTabs = [].slice.call(document.querySelectorAll("#tsTabsPrimary .ts-tab"));
    primaryTabs.forEach(function (t) { t.classList.toggle("is-on", t.dataset.primary === route.primary); });

    var $colabToolbar = document.getElementById("tsColabToolbar");
    var $secondaryTabs = document.getElementById("tsTabsSecondary");
    var esColaborador = route.primary === "colaborador";
    $colabToolbar.hidden = !esColaborador;
    $secondaryTabs.hidden = !esColaborador;
    if (esColaborador) {
      [].slice.call($secondaryTabs.querySelectorAll(".ts-tab")).forEach(function (t) {
        t.classList.toggle("is-on", t.dataset.view === route.sub);
      });
    }

    stopTrackerTicker();
    var $view = document.getElementById("tsView");
    $view.innerHTML = "";
    if (route.primary === "admin") { $view.appendChild(tpl("tpl-admin")); wireAdmin(); }
    else if (route.sub === "carga-online") { $view.appendChild(tpl("tpl-carga-online")); wireCargaOnline(); }
    else if (route.sub === "resumen") { $view.appendChild(tpl("tpl-resumen-historial")); wireHistorial(); }
    else { $view.appendChild(tpl("tpl-carga-hs")); wireCargaHs(); }
  }

  /* ---------- Helper de fechas compartido (semana Mon-Sun) ---------- */
  function diasDeLaSemana(semana) {
    var arr = [];
    for (var i = 0; i < 7; i++) arr.push(isoDate(addDays(semana, i)));
    return arr;
  }

  window.addEventListener("hashchange", router);

  /* ================= Carga on line (cronómetro + manual) ================= */
  function wireCargaOnline() {
    var colab = colaboradorActual();
    var $proj = document.getElementById("trkProyecto");
    populateSelect($proj, proyectosDe(colab ? colab.id : null), null);

    var $desc = document.getElementById("trkDesc");
    var $tags = document.getElementById("trkTags");
    var $time = document.getElementById("trkTime");
    var $start = document.getElementById("trkStart");

    var running = loadJSON(RUNNING_KEY, null);
    if (running && colab && running.colaboradorId === colab.id) {
      $desc.value = running.descripcion || "";
      $tags.value = (running.etiquetas || []).join(", ");
      if ([].slice.call($proj.options).some(function (o) { return o.value === running.proyecto; })) $proj.value = running.proyecto;
      startTrackerTicker(running);
    }

    $start.addEventListener("click", function () {
      var runningNow = loadJSON(RUNNING_KEY, null);
      if (runningNow) { detenerTracker(); }
      else { iniciarTracker(); }
    });

    document.getElementById("trkManual").addEventListener("click", function () { abrirManual(); });

    function iniciarTracker() {
      if (!colab) { toast("No hay colaboradores activos cargados en Nómina."); return; }
      var reg = {
        colaboradorId: colab.id,
        proyecto: $proj.value,
        descripcion: $desc.value.trim(),
        etiquetas: $tags.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean),
        inicioTs: Date.now(),
      };
      saveJSON(RUNNING_KEY, reg);
      startTrackerTicker(reg);
    }
    function detenerTracker() {
      var reg = loadJSON(RUNNING_KEY, null);
      if (!reg) return;
      var fin = new Date();
      var inicio = new Date(reg.inicioTs);
      var horas = (fin.getTime() - inicio.getTime()) / 3600000;
      if (horas < (1 / 3600)) { // menos de 1s, descartar
        localStorage.removeItem(RUNNING_KEY);
        stopTrackerTicker();
        resetTrackerUI();
        return;
      }
      var entry = {
        id: uid(), colaboradorId: reg.colaboradorId, proyecto: reg.proyecto,
        descripcion: reg.descripcion, etiquetas: reg.etiquetas,
        fecha: isoDate(inicio),
        inicio: String(inicio.getHours()).padStart(2, "0") + ":" + String(inicio.getMinutes()).padStart(2, "0"),
        fin: String(fin.getHours()).padStart(2, "0") + ":" + String(fin.getMinutes()).padStart(2, "0"),
        horas: Math.round(horas * 100) / 100,
        fuente: "tracker",
      };
      ENTRIES.push(entry);
      saveEntries(ENTRIES);
      localStorage.removeItem(RUNNING_KEY);
      stopTrackerTicker();
      resetTrackerUI();
      toast("Registro guardado");
    }
    function resetTrackerUI() {
      $start.textContent = "Inicio";
      $start.classList.remove("is-running");
      $time.textContent = "00:00:00";
      $desc.value = ""; $tags.value = "";
    }
  }

  /* ================= Resumen (historial completo del colaborador) ================= */
  function wireHistorial() {
    var colab = colaboradorActual();
    pintarLista();

    function pintarLista() {
      var $list = document.getElementById("trkList");
      var mias = ENTRIES.filter(function (e) { return colab && e.colaboradorId === colab.id; })
        .slice().sort(function (a, b) { return (b.fecha + (b.inicio || "")) < (a.fecha + (a.inicio || "")) ? -1 : 1; });
      if (!mias.length) {
        $list.innerHTML = '<p class="ts-vacio">Todavía no cargaste horas. Usá Carga on line o Carga de hs.</p>';
        return;
      }
      var semanas = {};
      mias.forEach(function (e) {
        var lunes = isoDate(mondayOf(parseISO(e.fecha)));
        (semanas[lunes] = semanas[lunes] || []).push(e);
      });
      var claves = Object.keys(semanas).sort().reverse();
      $list.innerHTML = claves.map(function (lunes) {
        var inicioSemana = parseISO(lunes);
        var finSemana = addDays(inicioSemana, 6);
        var entriesSemana = semanas[lunes];
        var totalSemana = entriesSemana.reduce(function (s, e) { return s + (Number(e.horas) || 0); }, 0);
        var porDia = {};
        entriesSemana.forEach(function (e) { (porDia[e.fecha] = porDia[e.fecha] || []).push(e); });
        var dias = Object.keys(porDia).sort().reverse();
        var htmlDias = dias.map(function (fecha) {
          var lista = porDia[fecha].sort(function (a, b) { return (a.inicio || "") < (b.inicio || "") ? 1 : -1; });
          var totalDia = lista.reduce(function (s, e) { return s + (Number(e.horas) || 0); }, 0);
          var filas = lista.map(function (e) {
            var rango = (e.inicio && e.fin) ? (e.inicio + " - " + e.fin) : "Manual";
            var tags = (e.etiquetas || []).length ? "🏷 " + e.etiquetas.map(esc).join(", ") : "";
            return '<div class="ts-entry">' +
              '<span class="ts-entry__desc' + (e.descripcion ? "" : " is-empty") + '">' + esc(e.descripcion || "Sin descripción") + "</span>" +
              '<span class="ts-entry__proj"><i class="ts-entry__dot"></i>' + esc(e.proyecto || "Interno") + "</span>" +
              '<span class="ts-entry__tags">' + tags + "</span>" +
              '<span class="ts-entry__range">' + rango + "</span>" +
              '<span class="ts-entry__dur">' + horasFmt(e.horas) + " hs</span>" +
              '<span class="ts-entry__actions">' +
                '<button type="button" class="ts-del" data-del="' + esc(e.id) + '" title="Eliminar">✕</button>' +
              "</span></div>";
          }).join("");
          return '<div class="ts-day"><div class="ts-day__head"><b>' + diaLargo(parseISO(fecha)) + "</b><span>Total: " + horasFmt(totalDia) + " hs</span></div>" + filas + "</div>";
        }).join("");
        return '<div class="ts-week"><div class="ts-week__head"><b>' + fechaCorta(inicioSemana) + " - " + fechaCorta(finSemana) + '</b><span>Total semanal: ' + horasFmt(totalSemana) + " hs</span></div>" + htmlDias + "</div>";
      }).join("");
    }

    document.getElementById("trkList").addEventListener("click", function (ev) {
      var del = ev.target.closest("[data-del]");
      if (!del) return;
      ENTRIES = ENTRIES.filter(function (e) { return e.id !== del.getAttribute("data-del"); });
      saveEntries(ENTRIES);
      pintarLista();
    });
  }

  function startTrackerTicker(reg) {
    var $time = document.getElementById("trkTime");
    var $start = document.getElementById("trkStart");
    if (!$time || !$start) return;
    $start.textContent = "Detener";
    $start.classList.add("is-running");
    function tick() {
      var seg = Math.floor((Date.now() - reg.inicioTs) / 1000);
      if ($time) $time.textContent = segFmt(seg);
    }
    tick();
    trkTimerHandle = setInterval(tick, 1000);
  }
  function stopTrackerTicker() {
    if (trkTimerHandle) { clearInterval(trkTimerHandle); trkTimerHandle = null; }
  }

  /* ================= Modal de carga manual ================= */
  var $manualModal = document.getElementById("manualModal");
  var $manualForm = document.getElementById("manualForm");
  var $manualError = document.getElementById("manualError");

  function abrirManual() {
    var colab = colaboradorActual();
    populateSelect(document.getElementById("manualProyecto"), proyectosDe(colab ? colab.id : null), null);
    $manualForm.reset();
    $manualForm.elements.fecha.value = isoDate(new Date());
    $manualError.hidden = true;
    $manualModal.hidden = false;
  }
  document.getElementById("manualCancel").addEventListener("click", function () { $manualModal.hidden = true; });
  $manualModal.addEventListener("click", function (ev) { if (ev.target.hasAttribute("data-close")) $manualModal.hidden = true; });
  $manualForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var colab = colaboradorActual();
    if (!colab) { $manualError.hidden = false; $manualError.textContent = "No hay un colaborador seleccionado."; return; }
    var f = $manualForm.elements;
    var fecha = f.fecha.value;
    var inicio = f.inicio.value, fin = f.fin.value;
    var horasManual = parseHorasInput(f.horas.value);
    if (!fecha) { $manualError.hidden = false; $manualError.textContent = "Elegí una fecha."; return; }
    var horas;
    if (inicio && fin) horas = horasEntreHM(inicio, fin);
    else if (horasManual > 0) horas = horasManual;
    else { $manualError.hidden = false; $manualError.textContent = "Cargá inicio y fin, o directamente la cantidad de horas."; return; }

    ENTRIES.push({
      id: uid(), colaboradorId: colab.id, proyecto: f.proyecto.value,
      descripcion: f.descripcion.value.trim(), etiquetas: [], fecha: fecha,
      inicio: inicio || "", fin: fin || "", horas: Math.round(horas * 100) / 100, fuente: "manual",
    });
    saveEntries(ENTRIES);
    $manualModal.hidden = true;
    toast("Horas cargadas");
    var route = currentRoute();
    if (route.primary === "colaborador" && route.sub === "resumen") renderView(route);
  });

  /* ================= Carga de hs (planilla semanal) ================= */
  function wireCargaHs() {
    var colab = colaboradorActual();

    document.getElementById("planPrev").addEventListener("click", function () { planWeekStart = addDays(planWeekStart, -7); pintarPlanilla(); });
    document.getElementById("planNext").addEventListener("click", function () { planWeekStart = addDays(planWeekStart, 7); pintarPlanilla(); });
    document.getElementById("planAddRow").addEventListener("click", function () {
      filas.push("");
      pintarPlanilla();
    });
    document.getElementById("planCopyPrev").addEventListener("click", copiarSemanaPasada);
    document.getElementById("planSaveTemplate").addEventListener("click", guardarPlantilla);

    var filas = filasIniciales();

    function filasIniciales() {
      if (!colab) return [];
      var deLaSemana = proyectosConHoras(colab.id, planWeekStart);
      if (deLaSemana.length) return deLaSemana;
      var plantilla = loadJSON(TEMPLATES_KEY, {})[colab.id];
      if (plantilla && plantilla.length) return plantilla.slice();
      return [proyectoDefault(colab)];
    }
    function proyectosConHoras(colabId, semana) {
      var dias = diasDeLaSemana(semana);
      var set = {};
      ENTRIES.forEach(function (e) {
        if (e.colaboradorId === colabId && e.fuente === "planilla" && dias.indexOf(e.fecha) !== -1) set[e.proyecto] = true;
      });
      return Object.keys(set);
    }
    function horasCelda(colabId, proyecto, fecha) {
      var e = ENTRIES.filter(function (x) { return x.colaboradorId === colabId && x.fuente === "planilla" && x.proyecto === proyecto && x.fecha === fecha; })[0];
      return e ? Number(e.horas) || 0 : 0;
    }
    function setCelda(colabId, proyecto, fecha, horas) {
      ENTRIES = ENTRIES.filter(function (x) { return !(x.colaboradorId === colabId && x.fuente === "planilla" && x.proyecto === proyecto && x.fecha === fecha); });
      if (horas > 0) ENTRIES.push({ id: uid(), colaboradorId: colabId, proyecto: proyecto, descripcion: "", etiquetas: [], fecha: fecha, inicio: "", fin: "", horas: horas, fuente: "planilla" });
      saveEntries(ENTRIES);
    }

    function pintarPlanilla() {
      var dias = diasDeLaSemana(planWeekStart).map(parseISO);
      document.getElementById("planLabel").textContent = fechaCorta(dias[0]) + " – " + fechaCorta(dias[6]);

      var $head = document.getElementById("planHeadRow");
      $head.innerHTML = "<th>Proyecto</th>" + dias.map(function (d) {
        return "<th>" + diaCorto(d) + ", " + fechaCorta(d) + "</th>";
      }).join("") + "<th>Total</th>";

      var $body = document.getElementById("planBody");
      $body.innerHTML = filas.map(function (proyecto, fi) {
        var celdas = dias.map(function (d) {
          var fecha = isoDate(d);
          var v = colab ? horasCelda(colab.id, proyecto, fecha) : 0;
          return '<td><input type="text" inputmode="decimal" data-fi="' + fi + '" data-fecha="' + fecha + '" value="' + (v ? v : "") + '" placeholder="0" /></td>';
        }).join("");
        var total = dias.reduce(function (s, d) { return s + (colab ? horasCelda(colab.id, proyecto, isoDate(d)) : 0); }, 0);
        var nombreCell = proyecto
          ? '<span class="ts-grid__proj">' + esc(proyecto) + '<button type="button" class="ts-grid__rm" data-rmfila="' + fi + '" title="Quitar fila">✕</button></span>'
          : '<input type="text" class="ts-grid__nueva" data-filanombre="' + fi + '" placeholder="Nombre del proyecto" />';
        return "<tr>" +
          "<td>" + nombreCell + "</td>" +
          celdas +
          '<td class="ts-total-col">' + horasFmt(total) + "</td>" +
        "</tr>";
      }).join("");

      var $foot = document.getElementById("planFootRow");
      var totalesDia = dias.map(function (d) {
        return filas.reduce(function (s, p) { return s + (colab && p ? horasCelda(colab.id, p, isoDate(d)) : 0); }, 0);
      });
      var totalGeneral = totalesDia.reduce(function (s, v) { return s + v; }, 0);
      $foot.innerHTML = "<td>Total</td>" + totalesDia.map(function (v) { return "<td>" + horasFmt(v) + "</td>"; }).join("") + "<td>" + horasFmt(totalGeneral) + "</td>";
    }

    document.getElementById("planBody").addEventListener("change", function (ev) {
      if (!colab) return;
      var input = ev.target;
      if (input.matches("[data-filanombre]")) {
        var fi = +input.getAttribute("data-filanombre");
        filas[fi] = input.value.trim();
        pintarPlanilla();
        return;
      }
      if (input.matches("[data-fi]")) {
        var fila = +input.getAttribute("data-fi");
        var proyecto = filas[fila];
        if (!proyecto) { toast("Ponele nombre al proyecto antes de cargar horas"); pintarPlanilla(); return; }
        setCelda(colab.id, proyecto, input.getAttribute("data-fecha"), parseHorasInput(input.value));
        pintarPlanilla();
      }
    });
    document.getElementById("planBody").addEventListener("click", function (ev) {
      var rm = ev.target.closest("[data-rmfila]");
      if (!rm) return;
      var fi = +rm.getAttribute("data-rmfila");
      var proyecto = filas[fi];
      if (colab && proyecto) diasDeLaSemana(planWeekStart).forEach(function (f) { setCelda(colab.id, proyecto, f, 0); });
      filas.splice(fi, 1);
      pintarPlanilla();
    });

    function copiarSemanaPasada() {
      if (!colab) return;
      var semanaAnterior = addDays(planWeekStart, -7);
      var diasAnt = diasDeLaSemana(semanaAnterior);
      var diasAct = diasDeLaSemana(planWeekStart);
      filas.forEach(function (proyecto) {
        if (!proyecto) return;
        diasAnt.forEach(function (fechaAnt, i) {
          var v = horasCelda(colab.id, proyecto, fechaAnt);
          if (v > 0) setCelda(colab.id, proyecto, diasAct[i], v);
        });
      });
      pintarPlanilla();
      toast("Se copiaron las horas de la semana pasada");
    }
    function guardarPlantilla() {
      if (!colab) return;
      var plantillas = loadJSON(TEMPLATES_KEY, {});
      plantillas[colab.id] = filas.filter(Boolean);
      saveJSON(TEMPLATES_KEY, plantillas);
      toast("Plantilla guardada para " + colab.nombre);
    }

    pintarPlanilla();
  }

  /* ================= Resumen mensual ================= */
  /* ================= Administración (panel para RRHH) ================= */
  function nombreMes(mesISO) {
    var p = mesISO.split("-");
    var d = new Date(+p[0], +p[1] - 1, 1);
    var s = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function wireAdmin() {
    var $segs = [].slice.call(document.querySelectorAll("[data-periodo]"));
    var $weekLabel = document.getElementById("adminWeekLabel");
    var $monthLabel = document.getElementById("adminMonthLabel");
    var $soloFaltan = document.getElementById("adminSoloFaltan");

    $segs.forEach(function (b) {
      b.addEventListener("click", function () {
        adminPeriodo = b.getAttribute("data-periodo");
        pintarAdmin();
      });
    });
    document.getElementById("adminPrev").addEventListener("click", function () {
      if (adminPeriodo === "semana") adminWeekStart = addDays(adminWeekStart, -7);
      else adminMonth = mesAdyacente(adminMonth, -1);
      pintarAdmin();
    });
    document.getElementById("adminNext").addEventListener("click", function () {
      if (adminPeriodo === "semana") adminWeekStart = addDays(adminWeekStart, 7);
      else adminMonth = mesAdyacente(adminMonth, 1);
      pintarAdmin();
    });
    $soloFaltan.checked = adminSoloFaltan;
    $soloFaltan.addEventListener("change", function () { adminSoloFaltan = $soloFaltan.checked; pintarAdmin(); });

    function mesAdyacente(mesISO, delta) {
      var p = mesISO.split("-");
      var d = new Date(+p[0], +p[1] - 1 + delta, 1);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    }

    function horasDelColaborador(colabId) {
      if (adminPeriodo === "semana") {
        var dias = diasDeLaSemana(adminWeekStart);
        return ENTRIES.filter(function (e) { return e.colaboradorId === colabId && dias.indexOf(e.fecha) !== -1; })
          .reduce(function (s, e) { return s + (Number(e.horas) || 0); }, 0);
      }
      return ENTRIES.filter(function (e) { return e.colaboradorId === colabId && (e.fecha || "").indexOf(adminMonth) === 0; })
        .reduce(function (s, e) { return s + (Number(e.horas) || 0); }, 0);
    }

    function pintarAdmin() {
      $segs.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-periodo") === adminPeriodo); });
      $weekLabel.hidden = adminPeriodo !== "semana";
      $monthLabel.hidden = adminPeriodo !== "mes";

      if (adminPeriodo === "semana") {
        var dias = diasDeLaSemana(adminWeekStart).map(parseISO);
        $weekLabel.textContent = fechaCorta(dias[0]) + " – " + fechaCorta(dias[6]);
      } else {
        $monthLabel.textContent = nombreMes(adminMonth);
      }

      var filas = COLABORADORES.map(function (c) {
        var horas = horasDelColaborador(c.id);
        return { colaborador: c, horas: horas, cargo: horas > 0 };
      }).sort(function (a, b) {
        if (a.cargo !== b.cargo) return a.cargo ? 1 : -1; // los que faltan, primero
        return a.colaborador.nombre.localeCompare(b.colaborador.nombre, "es");
      });

      var cargaron = filas.filter(function (f) { return f.cargo; }).length;
      var periodoTxt = adminPeriodo === "semana" ? "esta semana" : "este mes";
      document.getElementById("adminResumenTxt").textContent =
        cargaron + " de " + filas.length + " colaboradores cargaron horas " + periodoTxt + ".";

      var visibles = adminSoloFaltan ? filas.filter(function (f) { return !f.cargo; }) : filas;
      document.getElementById("adminBody").innerHTML = visibles.length
        ? visibles.map(function (f) {
            return "<tr><td>" + esc(f.colaborador.nombre) + "</td><td>" + horasFmt(f.horas) + " hs</td><td>" +
              (f.cargo
                ? '<span class="ts-badge ts-badge--ok">✓ Cargó</span>'
                : '<span class="ts-badge ts-badge--warn">⚠ Sin cargar</span>') +
              "</td></tr>";
          }).join("")
        : '<tr><td colspan="3" class="ts-vacio">Todos cargaron horas en este período.</td></tr>';
    }

    pintarAdmin();

    /* --- Enviar resumen a RRHH (totales mensuales por colaborador) --- */
    var $mes = document.getElementById("resMes");
    var hoy = new Date();
    $mes.value = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    $mes.addEventListener("change", pintarResumen);
    document.getElementById("resEnviar").addEventListener("click", enviarResumen);
    pintarResumen();

    function totalesDelMes(mes) {
      return COLABORADORES.map(function (c) {
        var total = ENTRIES.filter(function (e) { return e.colaboradorId === c.id && (e.fecha || "").indexOf(mes) === 0; })
          .reduce(function (s, e) { return s + (Number(e.horas) || 0); }, 0);
        return { colaborador: c, total: total };
      });
    }
    function pintarResumen() {
      var filas = totalesDelMes($mes.value);
      document.getElementById("resBody").innerHTML = filas.map(function (f) {
        return "<tr><td>" + esc(f.colaborador.nombre) + "</td><td>" + horasFmt(f.total) + " hs</td></tr>";
      }).join("") || '<tr><td colspan="2" class="ts-vacio">Sin colaboradores activos.</td></tr>';
    }
    function enviarResumen() {
      if (isPlaceholder(CONFIG.formActionUrl)) {
        toast("Este resumen todavía no está conectado a un destino real (falta configurar time-summary.js según SETUP.md).");
        return;
      }
      var filas = totalesDelMes($mes.value).filter(function (f) { return f.total > 0; });
      if (!filas.length) { toast("No hay horas cargadas en ese mes."); return; }
      var i = 0;
      function enviarSiguiente() {
        if (i >= filas.length) { toast("Resumen enviado (" + filas.length + " colaboradores)"); return; }
        var f = filas[i]; i++;
        var iframeName = "ts-submit-" + i;
        var $iframe = document.createElement("iframe");
        $iframe.name = iframeName; $iframe.style.display = "none";
        document.body.appendChild($iframe);
        var $form = document.createElement("form");
        $form.action = CONFIG.formActionUrl; $form.method = "POST"; $form.target = iframeName; $form.style.display = "none";
        function addHidden(entryId, value) {
          if (!entryId || isPlaceholder(entryId)) return;
          var input = document.createElement("input");
          input.type = "hidden"; input.name = entryId; input.value = value;
          $form.appendChild(input);
        }
        addHidden(CONFIG.entryIds.mes, $mes.value);
        addHidden(CONFIG.entryIds.colaborador, f.colaborador.nombre);
        addHidden(CONFIG.entryIds.horas, String(f.total));
        document.body.appendChild($form);
        $form.submit();
        setTimeout(function () { $form.remove(); $iframe.remove(); enviarSiguiente(); }, 700);
      }
      enviarSiguiente();
    }
  }

  renderShell();
})();
