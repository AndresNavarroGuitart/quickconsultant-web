# Tablero de Automatizaciones — Not a Bot Agency

Panel de control único para ver el estado y el rendimiento de los procesos
automatizados de la agencia: qué está operativo, qué pide atención, cuándo fue la
última corrida y con qué tasa de éxito.

Front estático (HTML + CSS + JS, sin build) con la identidad visual de
[notabotagency.es](https://notabotagency.es): tipografías **DM Serif Display** /
**Alegreya Sans**, verde `#03524E`/`#20574E` y acentos magenta `#CC3366` y
terracota `#C84E1E`. Soporta tema claro/oscuro.

## Estructura

| Archivo | Rol |
|---|---|
| `index.html` | Tablero: estructura de la página |
| `styles.css` | Estilos propios del tablero |
| `app.js` | Render de KPIs, grilla, filtros y panel de detalle |
| `data.js` | **Fuente de datos** del tablero (hoy datos de ejemplo) |
| `assets/theme.css` | Tokens de marca + shell (topbar, botones, footer) compartido por todas las vistas |
| `assets/logo.svg` | Logo Not a Bot Agency (vectorial) |
| `nomina/` | **Módulo Nómina de empleados** (ver abajo) |

## Módulo: Nómina de empleados (`nomina/`)

Alta y ficha de empleados. Al entrar se ve la lista; desde ahí se crea el
**perfil inicial** de cada persona: la sección **Datos personales** (foto, nombre,
apellido, DNI/RUT/Cédula, pasaporte, CUIT/CUIL, dirección legal, barrio, localidad,
provincia, país, mail, LinkedIn, tipo de contrato y cantidad de horas). Las
secciones siguientes de la ficha (datos bancarios, contrato, documentación) quedan
listadas como próximos pasos.

Los datos se guardan en `localStorage` del navegador (clave `nba-nomina-empleados`),
sin backend. Router por hash: `#/` lista · `#/nuevo` alta · `#/empleado/:id` edición.

La primera vez que se abre el módulo se cargan **10 empleados de ejemplo**
(`empleados-demo.js`). Desde el estado vacío hay un botón para volver a cargarlos.
Al conectar datos reales, borrar `empleados-demo.js` y su `<script>` en `index.html`.

| Archivo | Rol |
|---|---|
| `nomina/index.html` | Estructura + plantillas de lista y formulario |
| `nomina/nomina.css` | Estilos de la lista y la ficha |
| `nomina/nomina.js` | Router, CRUD sobre localStorage, validación del formulario |
| `nomina/empleados-demo.js` | Dataset de ejemplo (10 empleados) |

## Cómo agregar o editar un proceso

Editar el array `procesos` en [`data.js`](data.js). Cada entrada:

```js
{
  id: "slug-unico",
  nombre: "Nombre visible",
  categoria: "comercial",       // clave de TABLERO.categorias
  estado: "operativo",          // operativo | atencion | detenido
  descripcion: "Qué hace el proceso.",
  frecuencia: "Diaria · 07:00",
  ultimaEjecucion: "2026-08-28T07:03:00-03:00",
  duracionMedia: "≈ 3 min",
  exito7d: 98,                  // %
  ejecuciones7d: 7,
  responsable: "Nombre",
  enlace: "../alguna-app/",     // o null
  corridas: [
    { fecha: "2026-08-28T07:03:00-03:00", estado: "ok", detalle: "..." }
    // estado: ok | aviso | error
  ]
}
```

Los KPIs de arriba se recalculan solos a partir de esa lista.

## Conectar a datos reales

Reemplazar el contenido de `data.js` por una llamada al backend antes de que
corra `app.js`, manteniendo la misma forma de objeto en `window.TABLERO`.

## Desarrollo local

Servir la carpeta con cualquier servidor estático. Desde la raíz del repo:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

y abrir `http://localhost:3005/tablero-automatizaciones/index.html`
(el módulo Nómina queda en `.../tablero-automatizaciones/nomina/index.html`).
