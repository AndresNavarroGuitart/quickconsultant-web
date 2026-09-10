// Suscripción "gratis" otorgada a mano por un admin (botón en
// /admin/usuarios), sin pasar por MercadoPago. Reutiliza el modelo
// Subscription en vez de agregar un campo aparte: mercadopagoPreapprovalId
// es único y no-nulo, así que se usa un id sintético con este prefijo para
// poder identificarla (y volver a encontrarla al togglear) sin necesitar
// una columna extra.
const FREE_SUBSCRIPTION_PREFIX = "admin-free-";

export function freeSubscriptionId(userId: string) {
  return `${FREE_SUBSCRIPTION_PREFIX}${userId}`;
}

export function isFreeSubscription(mercadopagoPreapprovalId: string) {
  return mercadopagoPreapprovalId.startsWith(FREE_SUBSCRIPTION_PREFIX);
}
