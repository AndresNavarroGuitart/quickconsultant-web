import { prisma } from "@/lib/prisma";
import { getLastSignInMap } from "@/lib/admin/lastSignIn";
import { sportLabel } from "@/lib/athlete/sportsCatalog";
import UserActivityTable, {
  type UserActivityRow,
} from "@/components/UserActivityTable";

export default async function AdminActividadPage() {
  const [users, lastSignInMap] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // Hasta 2 perfiles por cuenta (self + dependiente): se muestran
        // agregados en una sola fila por usuario, no una fila por perfil.
        profiles: {
          include: {
            _count: { select: { matches: true, athleteClubs: true } },
            matches: {
              orderBy: { matchDate: "desc" },
              take: 1,
              select: { matchDate: true },
            },
          },
        },
      },
    }),
    getLastSignInMap(),
  ]);

  // Mas cerca a mas lejos: el acceso mas reciente primero, y quien nunca
  // entro (sin registro de Supabase Auth) al final.
  const sortedUsers = [...users].sort((a, b) => {
    const aTime = lastSignInMap.get(a.id);
    const bTime = lastSignInMap.get(b.id);
    return (bTime ? new Date(bTime).getTime() : -Infinity) -
      (aTime ? new Date(aTime).getTime() : -Infinity);
  });

  const tableRows: UserActivityRow[] = sortedUsers.map((u) => {
    const matchDates = u.profiles
      .map((p) => p.matches[0]?.matchDate ?? null)
      .filter((d): d is Date => d !== null);
    const lastMatchDate =
      matchDates.length > 0
        ? new Date(Math.max(...matchDates.map((d) => d.getTime())))
        : null;
    const totalClubs = u.profiles.reduce((sum, p) => sum + p._count.athleteClubs, 0);
    const totalMatches = u.profiles.reduce((sum, p) => sum + p._count.matches, 0);
    const lastSignInAt = lastSignInMap.get(u.id) ?? null;

    return {
      id: u.id,
      email: u.email,
      profileSummary: u.profiles
        .map((p) => `${p.displayName} · ${sportLabel(p.sport)}`)
        .join(", "),
      totalClubs,
      totalMatches,
      lastMatchLabel: lastMatchDate ? lastMatchDate.toLocaleDateString("es-AR") : "-",
      lastSignInLabel: lastSignInAt
        ? new Date(lastSignInAt).toLocaleString("es-AR")
        : "-",
      createdAtLabel: u.createdAt.toLocaleDateString("es-AR"),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Actividad de usuarios
      </h1>
      <p className="text-sm text-slate-500">
        Uso real de la app por usuario: perfil cargado, clubes, partidos y
        último acceso.
      </p>
      <UserActivityTable rows={tableRows} />
    </div>
  );
}
