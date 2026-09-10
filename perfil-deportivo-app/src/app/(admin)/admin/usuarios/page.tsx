import { prisma } from "@/lib/prisma";
import AdminUsersTable from "@/components/AdminUsersTable";
import { isFreeSubscription } from "@/lib/admin/freeSubscription";

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: true,
      profiles: { orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
      <AdminUsersTable
        users={users.map((u) => {
          // "Quien se registra": el perfil más viejo marca al titular de la
          // cuenta. Si lo creó para un menor (DEPENDENT) el nombre relevante
          // es el del responsable; si es para sí mismo, su propio nombre.
          const firstProfile = u.profiles[0];
          const registrantName = firstProfile
            ? firstProfile.subjectType === "DEPENDENT"
              ? firstProfile.guardianName
              : firstProfile.displayName
            : null;

          return {
            id: u.id,
            email: u.email,
            registrantName,
            profileCount: u.profiles.length,
            isAdmin: u.isAdmin,
            trialEndsAt: u.trialEndsAt.toISOString(),
            createdAt: u.createdAt.toISOString(),
            deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
            blockedAt: u.blockedAt ? u.blockedAt.toISOString() : null,
            hasFreeSubscription: u.subscriptions.some(
              (s) => isFreeSubscription(s.mercadopagoPreapprovalId) && s.status === "AUTHORIZED"
            ),
          };
        })}
      />
      <p className="text-xs text-slate-400">
        Cancelar una suscripción paga se hace directamente desde la cuenta de
        MercadoPago; estas acciones solo afectan el acceso por trial.
      </p>
      <p className="text-xs text-slate-400">
        Bloquear acceso corta todo (incluso con trial o suscripción activa) y
        es reversible; dar de baja borra los datos y no lo es.
      </p>
      <p className="text-xs text-slate-400">
        Las cuentas &quot;Dada de baja&quot; se autogestionaron desde Mi
        Perfil: sus perfiles, fotos, estadísticas y sugerencias ya se
        borraron y el email quedó anonimizado. Solo queda el registro para
        historial administrativo/contable.
      </p>
    </div>
  );
}
