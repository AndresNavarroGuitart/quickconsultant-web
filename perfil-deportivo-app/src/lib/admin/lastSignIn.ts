import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Ultimo acceso: no vive en nuestra base (no logueamos sesiones), pero
// Supabase Auth ya lo trackea por nosotros en auth.users.last_sign_in_at.
// Compartido entre las vistas de admin que necesitan cruzar esto con datos
// de public.User (Actividad, Metricas).
export async function getLastSignInMap(): Promise<Map<string, string | null>> {
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
    // Si Supabase Auth no responde (o faltan credenciales), seguimos sin la
    // info de ultimo acceso en vez de romper la pagina.
  }
  return map;
}
