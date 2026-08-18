import { prisma } from "@/lib/prisma";
import AdminUsersTable from "@/components/AdminUsersTable";

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
      <AdminUsersTable
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          isAdmin: u.isAdmin,
          trialEndsAt: u.trialEndsAt.toISOString(),
          createdAt: u.createdAt.toISOString(),
        }))}
      />
      <p className="text-xs text-slate-400">
        Cancelar una suscripción paga se hace directamente desde la cuenta de
        MercadoPago; estas acciones solo afectan el acceso por trial.
      </p>
    </div>
  );
}
