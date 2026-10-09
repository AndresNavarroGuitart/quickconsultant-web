// Interruptor general del cobro de suscripcion. En false la app es gratuita:
// nadie queda bloqueado por trial vencido, no se ofrece suscribirse y los
// textos hablan de "gratis". Todo el codigo de MercadoPago (checkout,
// webhook, cancelacion, historial de pagos) se conserva intacto: para volver
// a cobrar alcanza con poner true, sin tocar nada mas.
export const SUBSCRIPTIONS_ENABLED = false;
