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
| `index.html` | Estructura de la página |
| `styles.css` | Estilos y tokens de marca |
| `app.js` | Render de KPIs, grilla, filtros y panel de detalle |
| `data.js` | **Fuente de datos** (hoy datos de ejemplo) |
| `assets/logo.svg` | Logo Not a Bot Agency (vectorial) |

## Cómo agregar o editar un proceso

Editar el array `procesos` en [`data.js`](data.js). Cada entrada:

```js
{
  id: "slug-unico",
  nombre: "Nombre visible",
  categoria: "ventas",          // clave de TABLERO.categorias
  estado: "operativo",          // operativo | atencion | detenido
  descripcion: "Qué hace el proceso.",
  frecuencia: "Diaria · 07:00",
  ultimaEjecucion: "2026-08-28T07:03:00-03:00",
  duracionMedia: "≈ 3 min",
  exito7d: 98,                  // %
  ejecuciones7d: 7,
  responsable: "Nombre",
  enlace: "../facturacion-app/", // o null
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
powershell -File serve.ps1
```

y abrir `http://localhost:3005/tablero-automatizaciones/`.
