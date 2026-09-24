import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PAGE_SIZE = 1000;

// Ultimo acceso: no vive en nuestra base (no logueamos sesiones), pero
// Supabase Auth ya lo trackea por nosotros en auth.users.last_sign_in_at.
// Compartido entre las vistas de admin que necesitan cruzar esto con datos
// de public.User (Actividad, Metricas).
//
// listUsers pagina de a PAGE_SIZE: antes se pedia una sola pagina, asi que
// a partir del usuario 1001 la vista de Actividad perdia el dato de ultimo
// acceso sin avisar. Sigue pidiendo paginas hasta que una vuelve con menos
// de PAGE_SIZE (o vacia), que es la señal de que no hay mas.
export async function getLastSignInMap(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  try {
    for (let page = 1; ; page++) {
      const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });
      if (error) throw error;
      for (const u of data.users) {
        map.set(u.id, u.last_sign_in_at ?? null);
      }
      if (data.users.length < PAGE_SIZE) break;
    }
  } catch {
    // Si Supabase Auth no responde (o faltan credenciales), seguimos sin la
    // info de ultimo acceso en vez de romper la pagina.
  }
  return map;
}
