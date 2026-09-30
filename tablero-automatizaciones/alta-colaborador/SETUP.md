# Alta de colaborador — cómo conectarlo (pendiente)

Esta página (`alta-colaborador/`) es un formulario **con el diseño y la marca
de Not a Bot**, pero **todavía no está conectada a ningún destino real**. Hoy,
si alguien lo completa, al confirmar el consentimiento le va a avisar que "no
está conectado" y no se envía nada. Estos son los pasos para dejarlo
funcionando.

## Por qué no es un simple `<form action="...">`

El tablero es un sitio estático sin backend, así que no hay dónde recibir ni
guardar nada del lado del servidor. La solución elegida (ver conversación con
el equipo, ISO 27001) es que **el envío real vaya a un Google Form/Sheet
privado de Not a Bot** — así los datos quedan en su Workspace, con los
permisos y la seguridad que ya manejan, y nada de esto pasa por el repo
público de GitHub.

Los **campos de texto** se pueden enviar por detrás con un truco muy usado y
estable (un `<form>` oculto que apunta a la URL de `formResponse` de Google
Forms). Los **archivos** (DNI, pasaporte, CV) **no** se pueden recibir de la
misma forma: Google exige que quien sube un archivo a un Form esté logueado
con su cuenta de Google, y ese flujo corre necesariamente adentro de
`forms.google.com` — no se puede replicar desde una página externa. Por eso el
formulario tiene **dos pasos**: 1) datos de texto (invisible para el usuario,
en esta misma página) y 2) subida de documentos (un link que abre el Google
Form nativo, donde el usuario inicia sesión con Google y adjunta los
archivos).

## Paso 1 — Crear el Google Form de datos

1. En el Drive de Not a Bot (`notabotagency.com`), crear un Google Form nuevo
   con **una pregunta por cada campo** de texto del formulario (mismo orden
   no es necesario, solo que exista una por cada uno):

   `nombre, apellido, documento, cuit, pasaporte, nacionalidad, domicilio,
   codigoPostal, ciudad, provincia, pais, profesion, mail, telefono,
   linkedin, whatsapp, telegram, walletRed, walletDireccion, consentimiento`

   Todas como **"Respuesta corta"** (o "Párrafo" si se prefiere), no hace
   falta validación ahí — ya la hace esta página antes de enviar.

2. Elegir dónde guarda las respuestas: **Respuestas → ⋮ → Seleccionar destino
   de las respuestas → Crear una hoja de cálculo nueva** (o vincular una
   existente).

3. Restringir el acceso: **Configuración → Compartir con colaboradores**
   dejarlo dentro del Workspace de Not a Bot únicamente (no "cualquiera con
   el enlace").

## Paso 2 — Obtener la URL de envío y los `entry.XXXXXXXX`

1. Abrir el formulario en modo de **vista previa** (ícono del ojo).
2. Click derecho → **Ver código fuente de la página** (o `Ctrl+U`).
3. Buscar (`Ctrl+F` en el código fuente):
   - `action="https://docs.google.com/forms/d/e/…/formResponse"` → esa es la
     URL completa para `CONFIG.formActionUrl` en `alta-colaborador.js`.
   - Para cada pregunta, buscar `name="entry.` — vas a encontrar algo como
     `name="entry.1234567890"` justo antes de cada bloque de pregunta. Anotar
     cuál `entry.XXXXXXXXXX` corresponde a cuál pregunta (te guiás por el
     texto de la pregunta que aparece cerca en el HTML).

## Paso 3 — Completar la configuración

Editar `alta-colaborador/alta-colaborador.js`, dentro de `CONFIG`:

```js
formActionUrl: "https://docs.google.com/forms/d/e/TU_ID/formResponse",
entryIds: {
  nombre: "entry.111111111",
  apellido: "entry.222222222",
  // … uno por cada campo, con el entry.XXXX real que encontraste
},
```

## Paso 4 — Crear el Google Form de documentos

Otro Form aparte (o una segunda sección del mismo, da igual), con 4 preguntas
de tipo **"Subir archivo"**:

- Frente de DNI (obligatoria)
- Dorso de DNI (obligatoria)
- Pasaporte (opcional)
- CV en PDF (obligatoria)

Copiar el link de **"Enviar"** (el `viewform`, no el `formResponse` — este sí
se abre directo, no hace falta el truco del paso 2) y pegarlo en
`CONFIG.docsFormUrl`.

## Paso 5 — El texto legal (bloqueante)

`CONFIG.consentText` tiene un texto de marcador de posición. **No reemplazar
por ningún texto que no sea el aviso legal real de Not a Bot Agency**
(razón social, CUIT/NIF y contacto correctos) — mientras el `[Texto
pendiente]` siga ahí, el popup va a mostrar la advertencia en rojo
avisando que no está listo para usarse con gente real.

## Paso 6 — Probar antes de compartir el link

1. Completar el formulario de punta a punta uno mismo.
2. Confirmar que la fila aparece en la Sheet de respuestas.
3. Confirmar que el link de documentos abre el Form correcto y que los
   archivos suben bien.
4. Recién ahí, compartir la URL de `alta-colaborador/` con un nuevo
   colaborador real.

## Alta en Nómina (todavía manual)

Con esta configuración, las respuestas quedan en la Sheet — **no se cargan
solas en el módulo Nómina** (eso requiere el backend descripto en
`PLAN-PRODUCCION.md`). Por ahora, alguien de RRHH revisa la Sheet y carga a
mano el alta en `#/nuevo` de Nómina. Ver `nomina/EMPLEADOS-SYNC.md` para el
plan de automatizar este paso más adelante.
