# Sync de Nómina con Google Forms/Sheets — PLAN A FUTURO (no activar todavía)

## Objetivo

Que cuando un colaborador nuevo complete el formulario de alta —hoy
[`alta-colaborador/`](../alta-colaborador/index.html), ver su
[`SETUP.md`](../alta-colaborador/SETUP.md)— esa información entre directo a la
ficha de Nómina del tablero, sin tipearla a mano.

## Por qué está pausado hoy

El tablero, tal como está armado, **no es apto para tener datos reales de
personas**:

- Es un sitio estático público, servido por GitHub Pages, **sin login**
  (hallazgo **A-01** del análisis ISO 27001).
- Persiste todo en `localStorage` del navegador, **sin cifrar** — y la Nómina
  guarda DNI, dirección completa, teléfono, contacto de emergencia y, en
  Administración, **CBU/cuenta bancaria y remuneración** (hallazgo **A-02**).
- Cualquiera con el link ve el código fuente y, si hubiese datos reales
  cargados, los vería también (no hay backend que los oculte).

Conectar el Form real de RRHH a esto —aunque sea "solo para uso interno"—
significaría publicar datos personales y bancarios de compañeros reales en un
sitio público. Por eso se frena acá, con el mismo criterio que ya se aplicó al
sync de Notion (`proyectos/SYNC.md`) y a los nombres de contacto de clientes en
`proyectos-data.js`.

## Qué tiene que pasar antes de activarlo

1. **Destino con autenticación real** (dejar de servir esto desde GitHub Pages
   público). Opciones: hosting privado con login (Vercel/Netlify + auth),
   intranet interna, o algo con SSO de Google Workspace de Not a Bot.
2. **Persistencia del lado del servidor**, no `localStorage` del navegador —
   localStorage no cifra nada y no es un lugar seguro para PII ni datos
   bancarios, ni siquiera "mientras tanto".
3. **Acceso de lectura al Google Sheet** de respuestas del Form:
   - Service account de Google Cloud con el Sheet compartido (Sheets API,
     solo lectura), o
   - OAuth de la cuenta de quien es dueño del Form.
4. **Aviso/consentimiento a los empleados** de que sus datos se procesan en
   esta herramienta — esto aplica aparte de ISO 27001, por protección de datos
   personales en general.
5. Definir el comportamiento:
   - ¿Alta nueva vs. edición de un empleado que ya existe? ¿Cómo se matchea
     (por mail, por DNI)?
   - ¿Sync automático (cron, como el de Proyectos) o manual a demanda
     (botón "Importar desde el Form")?
   - ¿Qué campos del Form se traen automático y cuáles sigue completando RRHH
     a mano en el tablero (ej. legajo, centro de costo)?

## Boceto técnico (para cuando se habilite)

Mismo patrón que ya existe para Proyectos (`proyectos/sync-proyectos.mjs`, que
lee de Notion): un script Node que

1. Lee el Sheet vía **Google Sheets API** (paquete `googleapis`).
2. Mapea columnas del Form → campos del objeto empleado (tabla abajo, a
   completar con las columnas reales del Form el día que se retome esto).
3. Crea o actualiza el registro correspondiente **en el backend/API privado**
   del paso 1 — nunca en un archivo `.js` commiteado a este repo público,
   como se hace hoy con `empleados-demo.js`.

## Mapeo de campos — `alta-colaborador/` → ficha de Nómina

Ya se conoce el formulario real (spec del cliente, sept. 2026). Mapeo:

| Campo del formulario | Campo en la ficha de Nómina | Nota |
|---|---|---|
| `nombre` | `nombre` | — |
| `apellido` | `apellido` | — |
| `documento` (DNI) | `documento` | — |
| `cuit` | `cuit` | — |
| `pasaporte` | `pasaporte` | — |
| `nacionalidad` | _(nuevo campo)_ | Nómina no tiene `nacionalidad` hoy — agregar al modelo del empleado |
| `domicilio` + `codigoPostal` + `ciudad` + `provincia` | `direccionCompleta` | Componer los 4 en un solo string, o extender el modelo si se prefiere guardarlos separados |
| `pais` | `pais` | — |
| `profesion` | _(nuevo campo, no confundir con `rol`)_ | `rol` es el puesto en el proyecto; `profesion` es el título/profesión de base |
| `mail` | `mail` | — |
| `telefono` | `telefono` | — |
| `linkedin` | `linkedin` | — |
| `whatsapp` / `telegram` | _(nuevos campos)_ | Sí/No — agregar al modelo si se quiere conservar |
| `walletRed` + `walletDireccion` | `administracion.walletRed` / `.walletDireccion` | Extender el objeto `administracion` (hoy solo tiene banco/cuenta/alias/moneda tradicionales) |
| `docFrenteDni`, `docDorsoDni`, `docPasaporte`, `docCV` | `documentos[]` | Un registro por archivo, mismo shape que ya usa la solapa Documentos (`{ nombre, tipo, fecha, archivo }`) |
| Aceptación del consentimiento | `documentos[]` | Registrar como un documento más: `{ nombre: "Consentimiento de tratamiento de datos", tipo: "Otro", fecha }` |

No están cubiertos por el formulario (siguen completándose a mano en Nómina):
`estado`, `cliente`, `proyecto`, `rol`, `dedicacion`, `inicio`, `ptoAcordados`,
`equipamiento`, `contactoAlt*`, `administracion` (bancaria tradicional),
`seguimientos`, `relacion` — son datos operativos que define Not a Bot, no el
colaborador.

## Mientras tanto

La Nómina sigue funcionando con `empleados-demo.js` (datos 100% ficticios).
No cargar altas reales a mano tampoco, por la misma razón de fondo: el sitio
público no es un lugar seguro para eso todavía.
