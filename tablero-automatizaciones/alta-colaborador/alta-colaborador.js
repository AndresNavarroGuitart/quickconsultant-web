/* Alta de colaborador — formulario independiente del Tablero de Operaciones.
   No usa localStorage ni el repo como destino de datos: envía los campos de
   texto a un Google Form/Sheet privado de Not a Bot, y deriva la subida de
   documentos (DNI, pasaporte, CV) a un formulario nativo de Google aparte
   (los adjuntos de Google Forms requieren que el respondedor inicie sesión
   con Google — no se pueden recibir de forma confiable desde una página
   externa sin backend). Ver alta-colaborador/SETUP.md para dejarlo conectado. */
(function () {
  "use strict";

  /* ==========================================================
     CONFIGURACIÓN — completar según SETUP.md antes de usarlo
     ========================================================== */
  var CONFIG = {
    // URL de "formResponse" del Google Form que recibe los datos de texto.
    // Se obtiene reemplazando "viewform" por "formResponse" en la URL del form.
    formActionUrl: "REEMPLAZAR_CON_LA_URL_DE_FORMRESPONSE",

    // Mapeo: name del campo del HTML -> entry.XXXXXXXXX del Google Form.
    // Se obtienen inspeccionando el HTML del Google Form (ver SETUP.md).
    entryIds: {
      nombre: "REEMPLAZAR_entry_id",
      apellido: "REEMPLAZAR_entry_id",
      documento: "REEMPLAZAR_entry_id",
      cuit: "REEMPLAZAR_entry_id",
      pasaporte: "REEMPLAZAR_entry_id",
      nacionalidad: "REEMPLAZAR_entry_id",
      domicilio: "REEMPLAZAR_entry_id",
      codigoPostal: "REEMPLAZAR_entry_id",
      ciudad: "REEMPLAZAR_entry_id",
      provincia: "REEMPLAZAR_entry_id",
      pais: "REEMPLAZAR_entry_id",
      profesion: "REEMPLAZAR_entry_id",
      mail: "REEMPLAZAR_entry_id",
      telefono: "REEMPLAZAR_entry_id",
      linkedin: "REEMPLAZAR_entry_id",
      whatsapp: "REEMPLAZAR_entry_id",
      telegram: "REEMPLAZAR_entry_id",
      walletRed: "REEMPLAZAR_entry_id",
      walletDireccion: "REEMPLAZAR_entry_id",
      consentimiento: "REEMPLAZAR_entry_id", // opcional: registra el "Acepto"
    },

    // URL del Google Form aparte (nativo) donde el colaborador sube DNI,
    // pasaporte y CV — ese sí soporta adjuntos porque corre en forms.google.com.
    docsFormUrl: "REEMPLAZAR_CON_LA_URL_DEL_FORM_DE_DOCUMENTOS",

    // Texto legal de consentimiento. PENDIENTE: reemplazar por el aviso legal
    // real de Not a Bot Agency (razón social, identificación fiscal y
    // contacto correctos) antes de usar este formulario con gente real.
    consentText:
      "[Texto pendiente]\n\n" +
      "Este formulario todavía no tiene cargado el aviso legal de tratamiento " +
      "de datos personales de Not a Bot Agency. No debe usarse con " +
      "colaboradores reales hasta reemplazar este bloque por el texto legal " +
      "correcto (razón social, identificación fiscal/CUIT y contacto de " +
      "Not a Bot Agency), redactado o revisado por quien corresponda.",
  };
  var PLACEHOLDER = "REEMPLAZAR";

  /* ---------- Tema (mismo patrón que el resto del sitio) ---------- */
  var THEME_KEY = "nba-tablero-theme";
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

  var $form = document.getElementById("altaForm");
  var $formError = document.getElementById("formError");
  var $progreso = document.getElementById("progresoTexto");
  var $consentModal = document.getElementById("consentModal");
  var $consentPending = document.getElementById("consentPending");
  var $consentText = document.getElementById("consentText");
  var $consentCheckbox = document.getElementById("consentCheckbox");
  var $btnConfirmarConsent = document.getElementById("btnConfirmarConsent");
  var $docsModal = document.getElementById("docsModal");
  var $btnIrDocs = document.getElementById("btnIrDocs");

  function isPlaceholder(v) { return !v || v.indexOf(PLACEHOLDER) === 0; }

  /* ---------- Validación ---------- */
  function required($el) { return $el.hasAttribute("required"); }

  function campoValido(name) {
    var el = $form.elements[name];
    if (!el) return true;
    if (el.type === "file") {
      return !required(el) || (el.files && el.files.length > 0);
    }
    if (!required(el)) return true;
    if (el.tagName === "SELECT") return !!el.value;
    return el.value.trim() !== "";
  }

  function marcarCampo(name, ok) {
    var el = $form.elements[name];
    if (!el) return;
    var wrap = el.closest(".ac-field") || el.closest(".ac-file");
    var field = el.closest(".ac-field");
    el.setAttribute("aria-invalid", ok ? "false" : "true");
    if (field) field.classList.toggle("is-invalid", !ok);
    if (wrap && wrap.classList.contains("ac-file")) {
      wrap.classList.toggle("has-file", el.files && el.files.length > 0);
      var status = wrap.querySelector(".ac-file__status");
      if (status && el.files && el.files[0]) status.textContent = "✓ " + el.files[0].name;
    }
  }

  var CAMPOS_TEXTO = [
    "nombre", "apellido", "documento", "cuit", "pasaporte", "nacionalidad",
    "domicilio", "codigoPostal", "ciudad", "provincia", "pais", "profesion",
    "mail", "mailRepetir", "telefono", "linkedin", "whatsapp", "telegram",
    "walletRed", "walletDireccion",
  ];
  var CAMPOS_ARCHIVO = ["docFrenteDni", "docDorsoDni", "docPasaporte", "docCV"];

  function validarTodo() {
    var ok = true;
    CAMPOS_TEXTO.concat(CAMPOS_ARCHIVO).forEach(function (name) {
      var v = campoValido(name);
      marcarCampo(name, v);
      if (!v) ok = false;
    });
    var mail = $form.elements.mail.value.trim();
    var mail2 = $form.elements.mailRepetir.value.trim();
    var mailOk = mail && mail === mail2;
    marcarCampo("mailRepetir", mailOk);
    if (!mailOk) ok = false;
    return ok;
  }

  /* Revalida en vivo para dar feedback temprano sin ser invasivo */
  $form.addEventListener("input", function (ev) {
    if (ev.target.name) marcarCampo(ev.target.name, campoValido(ev.target.name));
  });
  $form.addEventListener("change", function (ev) {
    if (ev.target.name) marcarCampo(ev.target.name, campoValido(ev.target.name));
  });

  /* ---------- Paso 1: validar y abrir el popup de consentimiento ---------- */
  $form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    $formError.hidden = true;
    if (!validarTodo()) {
      $formError.hidden = false;
      $formError.textContent = "Revisá los campos marcados en rojo antes de continuar.";
      var primerInvalido = $form.querySelector(".is-invalid input, .is-invalid select, .ac-file:not(.has-file) input[required]");
      if (primerInvalido) primerInvalido.focus();
      return;
    }
    abrirConsentimiento();
  });

  function abrirConsentimiento() {
    $consentText.textContent = CONFIG.consentText;
    // El aviso de "texto pendiente" se muestra mientras no se haya reemplazado
    // el bloque de consentText por el texto legal real de Not a Bot Agency.
    $consentPending.hidden = CONFIG.consentText.indexOf("[Texto pendiente]") === -1;
    $consentCheckbox.checked = false;
    $btnConfirmarConsent.disabled = true;
    $consentModal.hidden = false;
  }
  function cerrarConsentimiento() { $consentModal.hidden = true; }

  $consentCheckbox.addEventListener("change", function () {
    $btnConfirmarConsent.disabled = !$consentCheckbox.checked;
  });
  document.getElementById("btnCancelarConsent").addEventListener("click", cerrarConsentimiento);
  $consentModal.addEventListener("click", function (ev) {
    if (ev.target.hasAttribute("data-close")) cerrarConsentimiento();
  });

  /* ---------- Paso 2: envío real (texto -> Google Form) ---------- */
  $btnConfirmarConsent.addEventListener("click", function () {
    if (isPlaceholder(CONFIG.formActionUrl)) {
      $formError.hidden = false;
      $formError.textContent =
        "Este formulario todavía no está conectado a un destino real (falta configurar " +
        "alta-colaborador.js según SETUP.md). No se envió ningún dato.";
      cerrarConsentimiento();
      return;
    }
    enviarDatos();
  });

  function enviarDatos() {
    $btnConfirmarConsent.disabled = true;
    $btnConfirmarConsent.textContent = "Enviando…";

    var iframeName = "ac-submit-target";
    var $iframe = document.createElement("iframe");
    $iframe.name = iframeName;
    $iframe.style.display = "none";
    document.body.appendChild($iframe);

    var $hiddenForm = document.createElement("form");
    $hiddenForm.action = CONFIG.formActionUrl;
    $hiddenForm.method = "POST";
    $hiddenForm.target = iframeName;
    $hiddenForm.style.display = "none";

    function addHidden(entryId, value) {
      if (!entryId || isPlaceholder(entryId)) return;
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = entryId;
      input.value = value;
      $hiddenForm.appendChild(input);
    }

    CAMPOS_TEXTO.forEach(function (name) {
      if (name === "mailRepetir") return; // no hace falta duplicar en el Sheet
      addHidden(CONFIG.entryIds[name], $form.elements[name].value.trim());
    });
    addHidden(CONFIG.entryIds.consentimiento, "Sí, " + new Date().toISOString());

    document.body.appendChild($hiddenForm);
    $hiddenForm.submit();

    // No podemos leer la respuesta cross-origin: asumimos éxito tras un
    // instante razonable y avanzamos al paso de documentación.
    setTimeout(function () {
      cerrarConsentimiento();
      $hiddenForm.remove();
      $iframe.remove();
      abrirPasoDocumentos();
    }, 900);
  }

  function abrirPasoDocumentos() {
    if (!isPlaceholder(CONFIG.docsFormUrl)) {
      $btnIrDocs.href = CONFIG.docsFormUrl;
    } else {
      $btnIrDocs.href = "#";
      $btnIrDocs.addEventListener("click", function (ev) { ev.preventDefault(); });
    }
    $docsModal.hidden = false;
  }
  $docsModal.addEventListener("click", function (ev) {
    if (ev.target.hasAttribute("data-close")) $docsModal.hidden = true;
  });
})();
