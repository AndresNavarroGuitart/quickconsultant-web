# Time Summary — cómo conectar el envío del resumen mensual

**Carga de hs**, **Carga on line** y **Resumen** (dentro de la solapa
Colaborador) funcionan hoy sin ninguna configuración extra: guardan todo en
`localStorage`, igual que el resto del tablero. Lo único que falta conectar es
el botón **"Enviar resumen del mes →"**, dentro de la solapa
**Administración** → "Enviar resumen a RRHH", que hoy avisa "no está
conectado" en vez de enviar nada.

## Por qué

Mismo motivo que en `alta-colaborador/`: no hay backend, así que el envío real
va a un **Google Form/Sheet privado de Not a Bot** (uno por colaborador y mes),
para que RRHH tenga los totales en una planilla y pueda liquidar el pago.

## Paso 1 — Crear el Google Form

En el Drive de `notabotagency.com`, crear un Form con 3 preguntas de
"Respuesta corta":

- `mes` (ej. "2026-09")
- `colaborador` (nombre y apellido)
- `horas` (total del mes)

Configurar el destino de las respuestas en una Sheet nueva o existente, y
restringir el acceso al Workspace de Not a Bot (no "cualquiera con el enlace").

## Paso 2 — Sacar la URL y los `entry.XXXX`

Igual que en `alta-colaborador/SETUP.md`: vista previa del Form → **Ver código
fuente de la página** → buscar `action="…/formResponse"` y los `name="entry.…"`
de cada pregunta.

## Paso 3 — Completar la configuración

Editar `time-summary/time-summary.js`, dentro de `CONFIG`:

```js
formActionUrl: "https://docs.google.com/forms/d/e/TU_ID/formResponse",
entryIds: {
  mes: "entry.111111111",
  colaborador: "entry.222222222",
  horas: "entry.333333333",
},
```

## Cómo funciona el envío

Al apretar "Enviar resumen del mes", el botón manda **una fila por
colaborador** con horas &gt; 0 ese mes (una petición por persona, con una
pequeña pausa entre cada una). Quedan todas juntas en la Sheet, una fila por
colaborador y mes.

## Alta en Nómina / liquidación (todavía manual)

Las horas no se cargan solas en ningún lado de Nómina — quedan en la Sheet
para que RRHH las use al liquidar. Automatizar esa parte (por ejemplo, mostrar
las horas del mes en la ficha del colaborador) requiere el backend descripto
en `PLAN-PRODUCCION.md`.

## Nota sobre control de integridad

Como todavía no hay login, cualquiera que abra este módulo puede elegir
cualquier colaborador del desplegable y cargarle horas — no hay forma de
verificar quién cargó qué. No es un problema de datos personales (acá no hay
DNI ni datos bancarios), pero sí de confiabilidad para un proceso que
determina un pago. Cuando exista login (`PLAN-PRODUCCION.md`), cada persona
debería poder cargar únicamente sus propias horas, y RRHH debería poder
aprobar/bloquear el mes antes de pagar.
