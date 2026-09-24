import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/mercadopago/pricing";
import SubscribeButton from "@/components/SubscribeButton";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import PendingPaymentBanner from "@/components/PendingPaymentBanner";

const PENDING_CONFIRMATION_WINDOW_MS = 30 * 60 * 1000;

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  IN_PROCESS: "En proceso",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  CHARGED_BACK: "Contracargo",
};

function formatAmount(amount: unknown, currency: string) {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(value);
  } catch {
    // Currency invalida para Intl (no debería pasar con montos reales de
    // MercadoPago, pero evita que la página rompa si alguna vez pasa).
    return `${value} ${currency}`;
  }
}

export default async function SuscripcionPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const { hasAccess, trialActive, hasActiveSubscription } = ctx.access;

  const [payments, recentPending] = await Promise.all([
    prisma.payment.findMany({
      where: { subscription: { userId: ctx.user.id } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    hasActiveSubscription
      ? null
      : prisma.subscription.findFirst({
          where: {
            userId: ctx.user.id,
            status: "PENDING",
            // Server Component: se recalcula en cada request (que es
            // justamente el punto, "hace 30 minutos" cambia con el tiempo),
            // no en cada re-render del cliente como asume esta regla.
            // eslint-disable-next-line react-hooks/purity
            createdAt: { gte: new Date(Date.now() - PENDING_CONFIRMATION_WINDOW_MS) },
          },
          orderBy: { createdAt: "desc" },
        }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Suscripción</h1>
      <p className="text-sm text-slate-600">
        Valor de la suscripción mensual {SUBSCRIPTION_PRICE_LABEL}.
      </p>
      <p className="text-sm text-slate-500">
        Estado actual:{" "}
        {hasActiveSubscription
          ? "suscripción activa"
          : trialActive
            ? `prueba gratuita activa hasta ${ctx.dbUser.trialEndsAt.toLocaleDateString("es-AR")}`
            : hasAccess
              ? "acceso activo"
              : "prueba vencida, sin suscripción activa"}
        .
      </p>

      {recentPending && <PendingPaymentBanner />}

      {hasActiveSubscription ? <CancelSubscriptionButton /> : <SubscribeButton />}

      {payments.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Historial de pagos
          </h2>
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Monto</th>
                  <th className="px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      {(p.paidAt ?? p.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-2">{formatAmount(p.amount, p.currency)}</td>
                    <td className="px-4 py-2">{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
