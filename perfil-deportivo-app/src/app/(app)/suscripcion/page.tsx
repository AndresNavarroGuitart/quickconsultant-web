import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import SubscribeButton from "@/components/SubscribeButton";

export default async function SuscripcionPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const { hasAccess, trialActive, hasActiveSubscription } = ctx.access;

  const payments = await prisma.payment.findMany({
    where: { subscription: { userId: ctx.user.id } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Suscripción</h1>
      <p className="text-sm text-slate-600">
        u$s10 por mes vía MercadoPago (el monto exacto en pesos se define en la
        cuenta de MercadoPago del sitio).
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

      {!hasActiveSubscription && <SubscribeButton />}

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
                    <td className="px-4 py-2">
                      {p.amount.toString()} {p.currency}
                    </td>
                    <td className="px-4 py-2">{p.status}</td>
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
