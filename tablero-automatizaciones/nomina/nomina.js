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

  /* ---------- Vista: ficha / formulario ---------- */
  function vistaForm(id) {
    var list = load();
    var emp = id ? list.find(function (e) { return e.id === id; }) : null;
    if (id && !emp) { location.hash = "#/"; return; }

    $app.innerHTML = "";
    $app.appendChild(tpl("tpl-form"));

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
      } else {
        datos.id = uid();
        datos.creado = new Date().toISOString();
        next.push(datos);
      }
      save(next);
      toast(emp ? "Datos actualizados" : "Empleado agregado a la nómina");
      location.hash = "#/";
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
