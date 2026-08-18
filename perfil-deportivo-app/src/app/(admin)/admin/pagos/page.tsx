import { prisma } from "@/lib/prisma";

export default async function AdminPagosPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: { user: true, payments: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Pagos</h1>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Estado suscripción</th>
              <th className="px-4 py-2">Monto</th>
              <th className="px-4 py-2">Próximo pago</th>
              <th className="px-4 py-2">Últimos pagos</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{s.user.email}</td>
                <td className="px-4 py-2">{s.status}</td>
                <td className="px-4 py-2">
                  {s.amount.toString()} {s.currency}
                </td>
                <td className="px-4 py-2">
                  {s.nextPaymentDate
                    ? s.nextPaymentDate.toLocaleDateString("es-AR")
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  {s.payments.length === 0
                    ? "-"
                    : s.payments
                        .map((p) => `${p.status} (${p.amount.toString()} ${p.currency})`)
                        .join(", ")}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={5}>
                  Todavía no hay suscripciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
