/* Nómina de empleados — alta y ficha (datos personales)
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
        // Primera vez: se siembra el dataset de ejemplo.
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
    toast(window.NOMINA_DEMO.length + " empleados de ejemplo cargados");
    vistaLista();
  }
  function uid() {
    return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  var CAMPOS = [
    "nombre", "apellido", "documento", "pasaporte", "cuit",
    "direccionLegal", "barrio", "localidad", "provincia", "pais",
    "mail", "linkedin", "tipoContrato", "horas", "foto",
  ];
  var REQUERIDOS = ["nombre", "apellido", "documento", "pais", "mail", "tipoContrato", "horas"];

  /* ---------- Helpers de DOM ---------- */
  function tpl(id) { return document.getElementById(id).content.cloneNode(true); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function iniciales(emp) {
    return ((emp.nombre || "").charAt(0) + (emp.apellido || "").charAt(0)).toUpperCase() || "–";
  }
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- Vista: lista ---------- */
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
        return [e.nombre, e.apellido, e.documento, e.mail, e.pais, e.tipoContrato]
          .join(" ").toLowerCase().indexOf(q) !== -1;
      });

      $vacio.hidden = list.length !== 0;
      $tablaWrap.hidden = list.length === 0;
      $count.textContent = list.length
        ? (vis.length === list.length ? list.length + " empleados" : vis.length + " de " + list.length)
        : "";

      $tbody.innerHTML = vis.map(function (e) {
        var avatar = e.foto
          ? '<img class="avatar" src="' + esc(e.foto) + '" alt="" />'
          : '<span class="avatar">' + esc(iniciales(e)) + "</span>";
        var nombre = esc(e.nombre) + " " + esc(e.apellido);
        return (
          '<tr tabindex="0" data-id="' + esc(e.id) + '" aria-label="Abrir ficha de ' + nombre + '">' +
            '<th scope="row" class="col-emp"><span class="col-emp__wrap">' + avatar +
              '<a class="planilla__nombre" href="#/empleado/' + esc(e.id) + '">' + nombre + "</a></span></th>" +
            "<td>" + esc(e.documento || "—") + "</td>" +
            '<td class="col-mail">' + (e.mail ? esc(e.mail) : "—") + "</td>" +
            "<td>" + (e.tipoContrato ? '<span class="badge">' + esc(e.tipoContrato) + "</span>" : "—") + "</td>" +
            '<td class="col-pais">' + esc(e.pais || "—") + "</td>" +
            '<td class="col-num">' + (e.horas ? esc(e.horas) : "—") + "</td>" +
            '<td class="col-chev" aria-hidden="true">›</td>' +
          "</tr>"
        );
      }).join("");
    }

    $tbody.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) return; // el link navega solo
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
  function fechaCorta(s) {
    var d = s ? new Date(s + (s.length === 10 ? "T00:00:00" : "")) : null;
    if (!d || isNaN(d)) return "—";
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function diasEntre(a, b) {
    var d1 = new Date(a), d2 = new Date(b);
    if (isNaN(d1) || isNaN(d2) || d2 < d1) return 0;
    return Math.round((d2 - d1) / 86400000) + 1;
  }

  /* ---------- Campos (helpers de markup) ---------- */
  function campo(name, label, type, req, extra) {
    return '<label class="campo"><span>' + label + (req ? ' <b>*</b>' : "") + "</span>" +
      '<input type="' + (type || "text") + '" name="' + name + '"' + (req ? " required" : "") +
      (extra || "") + " /></label>";
  }
  function campoSel(name, label, opts, req) {
    return '<label class="campo"><span>' + label + (req ? ' <b>*</b>' : "") + '</span><select name="' + name + '"' +
      (req ? " required" : "") + '><option value="">Elegí…</option>' +
      opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select></label>";
  }
  function estadoBadge(txt) {
    return '<span class="badge">' + esc(txt || "—") + "</span>";
  }

  var LIC_TIPOS = ["Vacaciones", "Enfermedad", "Licencia especial", "Sin goce de sueldo", "Estudio / examen", "Maternidad / Paternidad", "Duelo"];
  var LIC_ESTADOS = ["Solicitada", "Aprobada", "En curso", "Tomada", "Rechazada"];
  var DES_CALIF = ["Excelente", "Muy bueno", "Cumple expectativas", "A mejorar", "No cumple"];
  var DOC_TIPOS = ["Contrato", "Identificación (DNI/RUT/Cédula)", "CV", "Certificado", "Alta AFIP / Monotributo", "Título / Diploma", "Constancia de CBU", "Otro"];

  /* ---------- Solapa: Licencias ---------- */
  function renderLicencias(empId) {
    var emp = getEmp(empId); if (!emp) return;
    var arr = emp.licencias || [];
    var diasTomados = arr.filter(function (l) { return l.estado === "Tomada" || l.estado === "En curso"; })
      .reduce(function (s, l) { return s + (Number(l.dias) || 0); }, 0);
    var pend = arr.filter(function (l) { return l.estado === "Solicitada"; }).length;

    var filas = arr.length ? arr.map(function (l) {
      return "<tr><td>" + esc(l.tipo) + "</td><td>" + fechaCorta(l.desde) + "</td><td>" + fechaCorta(l.hasta) +
        '</td><td class="col-num">' + esc(l.dias || "—") + "</td><td>" + estadoBadge(l.estado) +
        '</td><td class="col-num"><button type="button" class="mini-del" data-del="' + esc(l.id) + '" aria-label="Quitar licencia">✕</button></td></tr>';
    }).join("") : '<tr><td colspan="6" class="sub-vacio">Sin licencias registradas.</td></tr>';

    document.getElementById("panel-licencias").innerHTML =
      '<div class="subpanel">' +
        '<div class="subpanel__head"><h2>Licencias</h2><div class="chips">' +
          '<span class="chip-stat">' + diasTomados + " días tomados</span>" +
          '<span class="chip-stat">' + pend + " pendientes</span></div></div>" +
        '<div class="tabla-wrap"><table class="planilla"><thead><tr>' +
          "<th>Tipo</th><th>Desde</th><th>Hasta</th><th class=\"col-num\">Días</th><th>Estado</th><th></th>" +
        '</tr></thead><tbody id="licBody">' + filas + "</tbody></table></div>" +
        '<form class="sub-form" id="licForm">' +
          campoSel("tipo", "Tipo", LIC_TIPOS, true) +
          campoSel("estado", "Estado", LIC_ESTADOS, true) +
          campo("desde", "Desde", "date", true) +
          campo("hasta", "Hasta", "date", true) +
          campo("nota", "Nota", "text", false, ' class=""') +
          '<button type="submit" class="btn">Agregar licencia</button>' +
        "</form>" +
      "</div>";

    document.getElementById("licBody").addEventListener("click", function (e) {
      var b = e.target.closest("[data-del]"); if (!b) return;
      patchEmp(empId, { licencias: (getEmp(empId).licencias || []).filter(function (l) { return l.id !== b.dataset.del; }) });
      toast("Licencia quitada"); renderLicencias(empId);
    });
    document.getElementById("licForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      var reg = { id: uid(), tipo: f.tipo.value, estado: f.estado.value, desde: f.desde.value, hasta: f.hasta.value, nota: f.nota.value.trim() };
      if (!reg.tipo || !reg.estado || !reg.desde || !reg.hasta) { toast("Completá tipo, estado y fechas"); return; }
      if (new Date(reg.hasta) < new Date(reg.desde)) { toast("La fecha 'hasta' es anterior a 'desde'"); return; }
      reg.dias = diasEntre(reg.desde, reg.hasta);
      patchEmp(empId, { licencias: (getEmp(empId).licencias || []).concat([reg]) });
      toast("Licencia agregada"); renderLicencias(empId);
    });
  }

  /* ---------- Solapa: Desempeño ---------- */
  function renderDesempeno(empId) {
    var emp = getEmp(empId); if (!emp) return;
    var arr = emp.desempeno || [];
    var ultima = arr.length ? arr[arr.length - 1].calificacion : null;

    var filas = arr.length ? arr.map(function (d) {
      return "<tr><td>" + esc(d.periodo) + "</td><td>" + esc(d.evaluador || "—") + "</td><td>" + estadoBadge(d.calificacion) +
        "</td><td>" + esc(d.resumen || "—") +
        '</td><td class="col-num"><button type="button" class="mini-del" data-del="' + esc(d.id) + '" aria-label="Quitar evaluación">✕</button></td></tr>';
    }).join("") : '<tr><td colspan="5" class="sub-vacio">Sin evaluaciones cargadas.</td></tr>';

    document.getElementById("panel-desempeno").innerHTML =
      '<div class="subpanel">' +
        '<div class="subpanel__head"><h2>Desempeño</h2>' +
          (ultima ? '<div class="chips"><span class="chip-stat">Última: ' + esc(ultima) + "</span></div>" : "") +
        "</div>" +
        '<div class="tabla-wrap"><table class="planilla"><thead><tr>' +
          "<th>Período</th><th>Evaluador</th><th>Calificación</th><th>Resumen</th><th></th>" +
        '</tr></thead><tbody id="desBody">' + filas + "</tbody></table></div>" +
        '<form class="sub-form" id="desForm">' +
          campo("periodo", "Período", "text", true, ' placeholder="1er semestre 2026"') +
          campo("evaluador", "Evaluador", "text", false) +
          campoSel("calificacion", "Calificación", DES_CALIF, true) +
          campo("resumen", "Resumen", "text", false) +
          '<button type="submit" class="btn">Agregar evaluación</button>' +
        "</form>" +
      "</div>";

    document.getElementById("desBody").addEventListener("click", function (e) {
      var b = e.target.closest("[data-del]"); if (!b) return;
      patchEmp(empId, { desempeno: (getEmp(empId).desempeno || []).filter(function (d) { return d.id !== b.dataset.del; }) });
      toast("Evaluación quitada"); renderDesempeno(empId);
    });
    document.getElementById("desForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      var reg = { id: uid(), periodo: f.periodo.value.trim(), evaluador: f.evaluador.value.trim(), calificacion: f.calificacion.value, resumen: f.resumen.value.trim() };
      if (!reg.periodo || !reg.calificacion) { toast("Completá período y calificación"); return; }
      patchEmp(empId, { desempeno: (getEmp(empId).desempeno || []).concat([reg]) });
      toast("Evaluación agregada"); renderDesempeno(empId);
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
        '</td><td class="col-num"><button type="button" class="mini-del" data-del="' + esc(d.id) + '" aria-label="Quitar documento">✕</button></td></tr>';
    }).join("") : '<tr><td colspan="5" class="sub-vacio">Sin documentos cargados.</td></tr>';

    document.getElementById("panel-documentos").innerHTML =
      '<div class="subpanel">' +
        '<div class="subpanel__head"><h2>Documentos</h2><div class="chips"><span class="chip-stat">' + arr.length + " archivo(s)</span></div></div>" +
        '<div class="tabla-wrap"><table class="planilla"><thead><tr>' +
          "<th>Documento</th><th>Tipo</th><th>Fecha</th><th>Archivo</th><th></th>" +
        '</tr></thead><tbody id="docBody">' + filas + "</tbody></table></div>" +
        '<form class="sub-form" id="docForm">' +
          campo("nombre", "Nombre del documento", "text", true) +
          campoSel("tipo", "Tipo", DOC_TIPOS, true) +
          campo("fecha", "Fecha", "date", false) +
          '<label class="campo"><span>Archivo (opcional)</span><input type="file" name="archivo" /></label>' +
          '<p class="hint campo--wide">Los archivos se guardan solo en este navegador. Máximo 4 MB.</p>' +
          '<button type="submit" class="btn">Agregar documento</button>' +
        "</form>" +
      "</div>";

    document.getElementById("docBody").addEventListener("click", function (e) {
      var b = e.target.closest("[data-del]"); if (!b) return;
      patchEmp(empId, { documentos: (getEmp(empId).documentos || []).filter(function (d) { return d.id !== b.dataset.del; }) });
      toast("Documento quitado"); renderDocumentos(empId);
    });
    document.getElementById("docForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
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
  }

  /* ---------- Solapa: Administración ---------- */
  var ADM_CAMPOS = ["legajo", "fechaIngreso", "centroCosto", "modalidadPago", "banco", "cuenta", "alias", "moneda", "remuneracion", "periodicidad", "cobertura", "notas"];
  function renderAdministracion(empId) {
    var emp = getEmp(empId); if (!emp) return;
    var a = emp.administracion || {};

    document.getElementById("panel-administracion").innerHTML =
      '<form class="ficha__form" id="admForm" novalidate><fieldset class="grupo"><legend>Administración</legend>' +
        '<div class="campos">' +
          campo("legajo", "Legajo") +
          campo("fechaIngreso", "Fecha de ingreso", "date") +
          campo("centroCosto", "Centro de costo") +
          campoSel("modalidadPago", "Modalidad de pago", ["Transferencia bancaria", "Efectivo", "Cheque", "Plataforma de pago"]) +
          campo("banco", "Banco") +
          campo("cuenta", "CBU / IBAN / N.º de cuenta") +
          campo("alias", "Alias") +
          campoSel("moneda", "Moneda", ["ARS", "UYU", "USD", "EUR", "CLP", "COP", "MXN", "BRL"]) +
          campo("remuneracion", "Remuneración bruta", "number", false, ' min="0" step="0.01"') +
          campoSel("periodicidad", "Periodicidad", ["Mensual", "Quincenal", "Semanal", "Por hora", "Por entregable"]) +
          campo("cobertura", "Obra social / Cobertura médica", "text", false, ' class=""') +
          '<label class="campo campo--wide"><span>Notas</span><input type="text" name="notas" /></label>' +
        "</div>" +
        '<div class="ficha__actions"><button type="submit" class="btn">Guardar administración</button></div>' +
      "</fieldset></form>";

    var $adm = document.getElementById("admForm");
    ADM_CAMPOS.forEach(function (k) { if ($adm.elements[k] && a[k] != null) $adm.elements[k].value = a[k]; });
    $adm.addEventListener("submit", function (e) {
      e.preventDefault();
      var obj = {};
      ADM_CAMPOS.forEach(function (k) { obj[k] = $adm.elements[k] ? $adm.elements[k].value.trim() : ""; });
      patchEmp(empId, { administracion: obj });
      toast("Administración guardada");
    });
  }

  /* ---------- Vista: ficha / formulario ---------- */
  function vistaForm(id) {
    var list = load();
    var emp = id ? list.find(function (e) { return e.id === id; }) : null;
    if (id && !emp) { location.hash = "#/"; return; }

    $app.innerHTML = "";
    $app.appendChild(tpl("tpl-form"));

    /* --- Solapas --- */
    var $tabs = [].slice.call(document.querySelectorAll(".ficha__tab"));
    function activarTab(name) {
      $tabs.forEach(function (t) {
        var on = t.dataset.tab === name;
        t.classList.toggle("is-current", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById("panel-" + t.dataset.tab);
        if (p) { p.hidden = !on; p.classList.toggle("is-current", on); }
      });
    }
    $tabs.forEach(function (t, idx) {
      if (!emp && t.dataset.tab !== "datos") {
        t.disabled = true;
        t.title = "Se habilita al guardar los datos personales";
      }
      t.addEventListener("click", function () { if (!t.disabled) activarTab(t.dataset.tab); });
      t.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var j = idx;
        do { j = (j + dir + $tabs.length) % $tabs.length; } while ($tabs[j].disabled && j !== idx);
        $tabs[j].focus();
        if (!$tabs[j].disabled) activarTab($tabs[j].dataset.tab);
      });
    });

    if (emp) {
      renderLicencias(emp.id);
      renderDesempeno(emp.id);
      renderDocumentos(emp.id);
      renderAdministracion(emp.id);
    } else {
      ["licencias", "desempeno", "documentos", "administracion"].forEach(function (n) {
        document.getElementById("panel-" + n).innerHTML =
          '<p class="panel-bloqueado">Guardá primero los datos personales para cargar esta sección.</p>';
      });
    }

    var $form = document.getElementById("form");
    var $error = document.getElementById("formError");
    var $foto = document.getElementById("foto");
    var $fotoPreview = document.getElementById("fotoPreview");
    var $fotoIniciales = document.getElementById("fotoIniciales");
    var $fotoClear = document.getElementById("fotoClear");
    var $eliminar = document.getElementById("btnEliminar");
    var fotoData = emp && emp.foto ? emp.foto : "";

    if (emp) {
      document.getElementById("formTitulo").textContent = emp.nombre + " " + emp.apellido;
      var $lede = document.getElementById("fichaLede");
      if ($lede) $lede.textContent = "Ficha completa. Elegí una solapa para ver o cargar datos.";
      CAMPOS.forEach(function (k) {
        if (k === "foto") return;
        var el = $form.elements[k];
        if (el && emp[k] != null) el.value = emp[k];
      });
      $eliminar.hidden = false;
    }

    function pintaFoto() {
      if (fotoData) {
        $fotoPreview.style.backgroundImage = 'url("' + fotoData + '")';
        $fotoPreview.dataset.empty = "false";
        $fotoClear.hidden = false;
      } else {
        $fotoPreview.style.backgroundImage = "";
        $fotoPreview.dataset.empty = "true";
        $fotoClear.hidden = true;
      }
      $fotoIniciales.textContent =
        (($form.elements.nombre.value || "").charAt(0) + ($form.elements.apellido.value || "").charAt(0)).toUpperCase() || "–";
    }

    $form.elements.nombre.addEventListener("input", pintaFoto);
    $form.elements.apellido.addEventListener("input", pintaFoto);

    $foto.addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        $error.hidden = false;
        $error.textContent = "La foto supera los 3 MB. Elegí una más liviana.";
        this.value = "";
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { fotoData = reader.result; pintaFoto(); };
      reader.readAsDataURL(file);
    });

    $fotoClear.addEventListener("click", function () {
      fotoData = ""; $foto.value = ""; pintaFoto();
    });

    $eliminar.addEventListener("click", function () {
      if (!emp) return;
      if (!confirm("¿Eliminar a " + emp.nombre + " " + emp.apellido + " de la nómina?")) return;
      var next = load().filter(function (e) { return e.id !== emp.id; });
      save(next);
      toast("Empleado eliminado");
      location.hash = "#/";
    });

    $form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      $error.hidden = true;

      var datos = {};
      CAMPOS.forEach(function (k) {
        if (k === "foto") return;
        var el = $form.elements[k];
        datos[k] = el ? el.value.trim() : "";
      });
      datos.foto = fotoData;

      var faltan = REQUERIDOS.filter(function (k) { return !datos[k]; });
      if (faltan.length) {
        $error.hidden = false;
        $error.textContent = "Faltan campos obligatorios: " + faltan.map(nombreCampo).join(", ");
        var primero = $form.elements[faltan[0]];
        if (primero) primero.focus();
        return;
      }
      if (datos.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.mail)) {
        $error.hidden = false;
        $error.textContent = "El mail no tiene un formato válido.";
        $form.elements.mail.focus();
        return;
      }
      if (datos.linkedin && !/^https?:\/\//i.test(datos.linkedin)) {
        datos.linkedin = "https://" + datos.linkedin;
      }

      var next = load();
      if (emp) {
        var i = next.findIndex(function (e) { return e.id === emp.id; });
        next[i] = Object.assign({}, next[i], datos, { actualizado: new Date().toISOString() });
        save(next);
        toast("Datos actualizados");
        location.hash = "#/";
      } else {
        datos.id = uid();
        datos.creado = new Date().toISOString();
        next.push(datos);
        save(next);
        toast("Empleado creado — ya podés cargar el resto de las solapas");
        location.hash = "#/empleado/" + datos.id;
      }
    });

    pintaFoto();
  }

  function nombreCampo(k) {
    return {
      nombre: "Nombre", apellido: "Apellido", documento: "DNI / RUT / Cédula",
      pais: "País", mail: "Mail", tipoContrato: "Tipo de contrato", horas: "Cantidad de hs.",
    }[k] || k;
  }

  /* ---------- Router ---------- */
  function router() {
    var h = location.hash || "#/";
    var mEmp = h.match(/^#\/empleado\/(.+)$/);
    if (h === "#/nuevo") { vistaForm(null); }
    else if (mEmp) { vistaForm(mEmp[1]); }
    else { vistaLista(); }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", router);
  router();
})();
