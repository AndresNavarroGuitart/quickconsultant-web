import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Ultimo acceso: no vive en nuestra base (no logueamos sesiones), pero
// Supabase Auth ya lo trackea por nosotros en auth.users.last_sign_in_at.
async function getLastSignInMap(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  try {
    const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({
      perPage: 1000,
    });
    if (error) throw error;
    for (const u of data.users) {
      map.set(u.id, u.last_sign_in_at ?? null);
    }
  } catch {
    // Si Supabase Auth no responde (o faltan credenciales), mostramos la
    // tabla igual sin la columna de último acceso en vez de romper la página.
  }
  return map;
}

export default async function AdminActividadPage() {
  const [users, lastSignInMap] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Actividad de usuarios
      </h1>
      <p className="text-sm text-slate-500">
        Uso real de la app por usuario: perfil cargado, clubes, partidos y
        último acceso.
      </p>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Perfil</th>
              <th className="px-4 py-2">Clubes</th>
              <th className="px-4 py-2">Partidos</th>
              <th className="px-4 py-2">Último partido</th>
              <th className="px-4 py-2">Último acceso</th>
              <th className="px-4 py-2">Alta</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const lastMatchDate = u.profile?.matches[0]?.matchDate ?? null;
              const lastSignInAt = lastSignInMap.get(u.id) ?? null;
              return (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    {u.profile ? (
                      <span>
                        {u.profile.displayName}
                        <span className="text-slate-400"> · {u.profile.sport}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Sin perfil</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{u.profile?._count.athleteClubs ?? 0}</td>
                  <td className="px-4 py-2">{u.profile?._count.matches ?? 0}</td>
                  <td className="px-4 py-2">
                    {lastMatchDate
                      ? new Date(lastMatchDate).toLocaleDateString("es-AR")
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {lastSignInAt
                      ? new Date(lastSignInAt).toLocaleString("es-AR")
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {u.createdAt.toLocaleDateString("es-AR")}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={7}>
                  Todavía no hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
