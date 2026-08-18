import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components y Route Handlers.
 *
 * `cookies()` es async en Next 16, por eso esta función también lo es.
 * Si se llama desde un Server Component (no un Route Handler ni un Server
 * Action), `setAll` puede fallar al intentar escribir cookies durante el
 * render — se ignora ese error porque el refresco de sesión ya lo maneja
 * `proxy.ts` en cada request.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // El método `set` fue llamado desde un Server Component.
            // Esto se puede ignorar porque proxy.ts refresca la sesión
            // en cada request.
          }
        },
      },
    }
  );
}
