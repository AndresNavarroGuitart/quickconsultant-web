import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [totalUsers, activeSubscriptions, pendingSuggestions] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "AUTHORIZED" } }),
    prisma.suggestion.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Resumen admin
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Usuarios registrados" value={totalUsers} />
        <StatCard label="Suscripciones activas" value={activeSubscriptions} />
        <StatCard label="Sugerencias sin revisar" value={pendingSuggestions} />
      </div>
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
