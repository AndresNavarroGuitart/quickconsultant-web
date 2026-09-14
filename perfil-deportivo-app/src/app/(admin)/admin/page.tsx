import { prisma } from "@/lib/prisma";
import { getLastSignInMap } from "@/lib/admin/lastSignIn";
import { isFreeSubscription } from "@/lib/admin/freeSubscription";
import { sportLabel, positionLabel } from "@/lib/athlete/sportsCatalog";
import { countryName } from "@/lib/athlete/countries";

const RETENTION_WEEKS = [1, 2, 3, 4];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const AGE_BUCKETS: { label: string; test: (age: number) => boolean }[] = [
  { label: "Hasta 12 años", test: (a) => a <= 12 },
  { label: "13 a 17 años", test: (a) => a >= 13 && a <= 17 },
  { label: "18 a 25 años", test: (a) => a >= 18 && a <= 25 },
  { label: "26 a 40 años", test: (a) => a >= 26 && a <= 40 },
  { label: "Más de 40 años", test: (a) => a > 40 },
];

export default async function AdminOverviewPage() {
  const [users, activeSubscriptions, pendingSuggestions, lastSignInMap, profiles] =
    await Promise.all([
      prisma.user.findMany({
        include: {
          profiles: { include: { _count: { select: { matches: true } } } },
          subscriptions: true,
        },
      }),
      prisma.subscription.count({ where: { status: "AUTHORIZED" } }),
      prisma.suggestion.count({ where: { status: "NEW" } }),
      getLastSignInMap(),
      prisma.athleteProfile.findMany({
        select: {
          sport: true,
          position: true,
          subjectType: true,
          birthDate: true,
          country: true,
        },
      }),
    ]);

  const totalUsers = users.length;

  // Las cuentas dadas de baja se borraron a propósito (ver deleteAccount.ts):
  // no tienen perfiles/partidos que consultar, así que no pueden evaluarse
  // en ningún embudo. Se excluyen de las 3 métricas de abajo.
  const activeUsers = users.filter((u) => !u.deletedAt);
  const now = Date.now();

  // --- Embudo de activación --------------------------------------------
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

  // --- Curva de retención (por último acceso conocido) ------------------
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

  // --- Conversión a suscripción paga -------------------------------------
  // Se excluyen admins (no pagan) y las suscripciones "gratis" otorgadas a
  // mano desde /admin/usuarios (no son una conversión real).
  const payingEligible = activeUsers.filter((u) => !u.isAdmin);
  const converted = payingEligible.filter((u) =>
    u.subscriptions.some(
      (s) => s.status === "AUTHORIZED" && !isFreeSubscription(s.mercadopagoPreapprovalId)
    )
  );
  const conversionRate = pct(converted.length, payingEligible.length);

  // --- Público: deportes, posiciones y datos generales -------------------
  const totalProfiles = profiles.length;

  const sportCounts = new Map<string, number>();
  for (const p of profiles) sportCounts.set(p.sport, (sportCounts.get(p.sport) ?? 0) + 1);
  const sportsBreakdown = [...sportCounts.entries()]
    .map(([sport, count]) => ({ label: sportLabel(sport), count }))
    .sort((a, b) => b.count - a.count);

  const positionCounts = new Map<string, { label: string; count: number }>();
  for (const p of profiles) {
    const key = `${p.sport}::${p.position ?? ""}`;
    const label = p.position
      ? `${sportLabel(p.sport)} · ${positionLabel(p.sport, p.position) ?? p.position}`
      : `${sportLabel(p.sport)} · sin posición`;
    const current = positionCounts.get(key);
    positionCounts.set(key, { label, count: (current?.count ?? 0) + 1 });
  }
  const positionsBreakdown = [...positionCounts.values()].sort((a, b) => b.count - a.count);

  const selfProfiles = profiles.filter((p) => p.subjectType === "SELF").length;
  const dependentProfiles = profiles.filter((p) => p.subjectType === "DEPENDENT").length;

  const agesKnown = profiles
    .map((p) => (p.birthDate ? ageFromBirthDate(p.birthDate) : null))
    .filter((age): age is number => age !== null);
  const ageBreakdown = AGE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: agesKnown.filter(bucket.test).length,
  }));
  const withoutBirthDate = totalProfiles - agesKnown.length;

  const countryCounts = new Map<string, number>();
  for (const p of profiles) {
    const label = p.country ? (countryName(p.country) ?? p.country) : "Sin especificar";
    countryCounts.set(label, (countryCounts.get(label) ?? 0) + 1);
  }
  const countryBreakdown = [...countryCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Resumen admin
        </h1>
        {totalSignups < 20 && (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Muestra chica ({totalSignups} cuenta{totalSignups === 1 ? "" : "s"}
            ): las métricas de activación/retención/conversión de más abajo
            son solo una referencia todavía, no algo estadísticamente sólido.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Usuarios registrados" value={totalUsers} />
        <StatCard label="Suscripciones activas" value={activeSubscriptions} />
        <StatCard label="Sugerencias sin revisar" value={pendingSuggestions} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Activación</h2>
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

      <section className="flex flex-col gap-3 border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Quiénes usan la app
        </h2>
        <p className="text-sm text-slate-500">
          Deportes, posiciones y datos generales de los {totalProfiles}{" "}
          perfil{totalProfiles === 1 ? "" : "es"} deportivo
          {totalProfiles === 1 ? "" : "s"} cargados (no cuentas -- una cuenta
          puede tener hasta 2).
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <BreakdownCard
            title="Deportes"
            rows={sportsBreakdown}
            total={totalProfiles}
          />
          <BreakdownCard
            title="Posiciones"
            rows={positionsBreakdown}
            total={totalProfiles}
          />
          <BreakdownCard
            title="Tipo de perfil"
            rows={[
              { label: "Propio (el usuario juega)", count: selfProfiles },
              { label: "De un hijo/a a cargo", count: dependentProfiles },
            ]}
            total={totalProfiles}
          />
          <BreakdownCard
            title="Edad"
            rows={[
              ...ageBreakdown,
              ...(withoutBirthDate > 0
                ? [{ label: "Sin fecha de nacimiento", count: withoutBirthDate }]
                : []),
            ]}
            total={totalProfiles}
          />
          <BreakdownCard
            title="País"
            rows={countryBreakdown}
            total={totalProfiles}
            className="sm:col-span-2"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  );
}

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

function BreakdownCard({
  title,
  rows,
  total,
  className = "",
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-slate-200 bg-white p-4 ${className}`}>
      <p className="mb-2 text-sm font-semibold text-slate-900">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos todavía.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">{row.label}</span>
              <span className="shrink-0 text-sm font-medium text-brand-700">
                {row.count}{" "}
                <span className="font-normal text-slate-400">
                  ({pct(row.count, total)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
