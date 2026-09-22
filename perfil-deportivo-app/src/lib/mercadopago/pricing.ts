// Unica fuente del precio de la suscripcion: antes vivia duplicado (el
// monto real en checkout/route.ts y el texto "$10.000" a mano en la
// landing y en /suscripcion), asi que cambiar el precio implicaba tocar
// tres lugares y era facil que el texto quedara desactualizado.
export const SUBSCRIPTION_AMOUNT = Number(
  process.env.MERCADOPAGO_SUBSCRIPTION_AMOUNT ?? "10"
);
export const SUBSCRIPTION_CURRENCY = process.env.MERCADOPAGO_SUBSCRIPTION_CURRENCY ?? "ARS";

// Ej. "$3.500 (Ar$)" -- coincide con como ya se mostraba el precio.
export const SUBSCRIPTION_PRICE_LABEL = `$${SUBSCRIPTION_AMOUNT.toLocaleString("es-AR")} (Ar$)`;
