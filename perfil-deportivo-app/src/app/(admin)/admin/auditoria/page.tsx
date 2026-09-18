import { prisma } from "@/lib/prisma";

const ACTION_LABEL: Record<string, string> = {
  extendTrial: "Extendió el trial",
  revokeAccess: "Revocó el acceso",
  setAdmin: "Cambió permiso de admin",
  block: "Bloqueó la cuenta",
  unblock: "Desbloqueó la cuenta",
  grantFreeSubscription: "Otorgó suscripción gratis",
  revokeFreeSubscription: "Revocó suscripción gratis",
  updateSuggestion: "Actualizó una sugerencia",
  sendNotification: "Envió una notificación",
};

export default async function AdminAuditoriaPage() {
  const logs = await prisma.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      adminUser: { select: { email: true } },
      targetUser: { select: { email: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Auditoría de acciones de admin
      </h1>
      <p className="text-sm text-slate-500">
        Quién hizo qué y sobre qué cuenta, últimas 200 acciones.
      </p>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Cuenta afectada</th>
              <th className="px-4 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 whitespace-nowrap">
                  {log.createdAt.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-2">{log.adminUser.email}</td>
                <td className="px-4 py-2">
                  {ACTION_LABEL[log.action] ?? log.action}
                </td>
                <td className="px-4 py-2">
                  {log.targetUser?.email ?? (
                    <span className="text-slate-400">Todos los usuarios</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-slate-400">
                  {log.metadata ? JSON.stringify(log.metadata) : ""}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={5}>
                  Todavía no hay acciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
