import { PreApproval } from "mercadopago";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import { isFreeSubscription } from "@/lib/admin/freeSubscription";
import { prisma } from "@/lib/prisma";

// Cancela en MercadoPago (y marca CANCELLED en la base) todas las
// suscripciones no resueltas de un usuario (autorizadas, pendientes o
// pausadas). La usan tanto la baja de cuenta (no tiene sentido seguir
// cobrandole a alguien que ya no puede entrar a la app a cancelarla) como
// el boton "Cancelar suscripcion" de /suscripcion, sin dar de baja la
// cuenta. Las suscripciones "gratis" (otorgadas a mano por un admin, con id
// sintetico "admin-free-...") no existen en MercadoPago: cancelarlas es
// solo un update local, sin llamar a la API.
//
// Si falla la llamada a MercadoPago para alguna suscripcion, esta funcion
// tira el error hacia arriba en vez de tragarlo: al que llama (deleteAccount,
// la ruta de cancelacion) le conviene abortar antes que dejar a alguien
// pensando que ya canceló cuando en MercadoPago le van a seguir cobrando.
export async function cancelMercadoPagoSubscriptions(userId: string) {
  const subs = await prisma.subscription.findMany({
    where: { userId, status: { in: ["AUTHORIZED", "PENDING", "PAUSED"] } },
  });
  if (subs.length === 0) return;

  const preApproval = new PreApproval(getMercadoPagoConfig());

  for (const sub of subs) {
    if (!isFreeSubscription(sub.mercadopagoPreapprovalId)) {
      try {
        await preApproval.update({
          id: sub.mercadopagoPreapprovalId,
          body: { status: "cancelled" },
        });
      } catch (err) {
        throw new Error(
          `No se pudo cancelar la suscripción ${sub.mercadopagoPreapprovalId} en MercadoPago: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }
}
