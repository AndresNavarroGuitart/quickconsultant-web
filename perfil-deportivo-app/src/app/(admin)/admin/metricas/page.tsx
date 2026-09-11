import { prisma } from "@/lib/prisma";
import { getLastSignInMap } from "@/lib/admin/lastSignIn";
import { isFreeSubscription } from "@/lib/admin/freeSubscription";

const RETENTION_WEEKS = [1, 2, 3, 4];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function AdminMetricasPage() {
  const [users, lastSignInMap] = await Promise.all([
    prisma.user.findMany({
      include: {
        profiles: { include: { _count: { select: { matches: true } } } },
        subscriptions: true,
      },
    }),
    getLastSignInMap(),
  ]);

  // Las cuentas dadas de baja se borraron a propósito (ver deleteAccount.ts):
  // no tienen perfiles/partidos que consultar, así que no pueden evaluarse
  // en ningún embudo. Se excluyen de las 3 métricas.
  const activeUsers = users.filter((u) => !u.deletedAt);
  const now = Date.now();

  // --- 1) Embudo de activación ---------------------------------------
  const totalSignups = activeUsers.length;
  const withProfile = activeUsers.filter((u) => u.profiles.length > 0).length;
  const withMatch = activeUsers.filter((u) =>
    u.profiles.some((p) => p._count.matches > 0)
  ).length;

  const funnel = [
    { label: "Cuentas dadas de alta", count: totalSignups, pct: 100 },
    {
      label: "Completaron su perfil",
      count: withProfile,
      pct: pct(withProfile, totalSignups),
    },
    {
      label: "Cargaron al menos 1 partido",
      count: withMatch,
      pct: pct(withMatch, totalSignups),
    },
  ];

  // --- 2) Curva de retención (por último acceso conocido) -------------
  // "Retenido en la semana N" = su último acceso ocurrió al menos N*7 días
  // después del alta. Solo se cuentan cuentas con antigüedad suficiente
  // para haber podido llegar a esa semana (si te registraste hace 10 días
  // todavía no podés "fallar" la semana 3).
  const retention = RETENTION_WEEKS.map((week) => {
    const thresholdMs = week * 7 * MS_PER_DAY;
    const eligible = activeUsers.filter(
      (u) => now - u.createdAt.getTime() >= thresholdMs
    );
    const retained = eligible.filter((u) => {
      const lastSignInAt = lastSignInMap.get(u.id);
      if (!lastSignInAt) return false;
      return new Date(lastSignInAt).getTime() - u.createdAt.getTime() >= thresholdMs;
    });
    return {
      week,
      eligibleCount: eligible.length,
      retainedCount: retained.length,
      pct: pct(retained.length, eligible.length),
    };
  });

  // --- 3) Conversión a suscripción paga --------------------------------
  // Se excluyen admins (no pagan) y las suscripciones "gratis" otorgadas a
  // mano desde /admin/usuarios (no son una conversión real).
  const payingEligible = activeUsers.filter((u) => !u.isAdmin);
  const converted = payingEligible.filter((u) =>
    u.subscriptions.some(
      (s) => s.status === "AUTHORIZED" && !isFreeSubscription(s.mercadopagoPreapprovalId)
    )
  );
  const conversionRate = pct(converted.length, payingEligible.length);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Métricas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Activación, retención y conversión a suscripción paga.
        </p>
        {totalSignups < 20 && (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Muestra chica ({totalSignups} cuenta{totalSignups === 1 ? "" : "s"}
            ): tomá estos porcentajes como referencia, no como algo
            estadísticamente sólido todavía.
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Activación
        </h2>
        <p className="text-sm text-slate-500">
          Cuánto de cada alta se convierte en uso real de la app.
        </p>
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          {funnel.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-center justify-between px-4 py-3 ${
                i > 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <span className="text-sm text-slate-700">{step.label}</span>
              <span className="text-sm font-semibold text-brand-700">
                {step.count}{" "}
                <span className="font-normal text-slate-400">
                  ({step.pct}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Retención</h2>
        <p className="text-sm text-slate-500">
          % de cuentas que todavía volvían a ingresar N semanas después del
          alta (solo cuentas con antigüedad suficiente para esa semana).
        </p>
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-2">Semana</th>
                <th className="px-4 py-2">Elegibles</th>
                <th className="px-4 py-2">Retenidos</th>
                <th className="px-4 py-2">%</th>
              </tr>
            </thead>
            <tbody>
              {retention.map((r) => (
                <tr key={r.week} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">Semana {r.week}</td>
                  <td className="px-4 py-2">{r.eligibleCount}</td>
                  <td className="px-4 py-2">{r.retainedCount}</td>
                  <td className="px-4 py-2 font-semibold text-brand-700">
                    {r.eligibleCount === 0 ? "—" : `${r.pct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Conversión a suscripción paga
        </h2>
        <p className="text-sm text-slate-500">
          Cuentas no-admin con una suscripción autorizada y realmente pagada
          (no cuenta el trial ni las suscripciones gratis que otorga el
          admin).
        </p>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-3xl font-semibold text-brand-700">
            {conversionRate}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {converted.length} de {payingEligible.length} cuenta
            {payingEligible.length === 1 ? "" : "s"} elegible
            {payingEligible.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>
    </div>
  );
}

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}
