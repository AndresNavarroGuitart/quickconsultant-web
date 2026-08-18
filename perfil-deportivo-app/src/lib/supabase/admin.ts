import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase con la service role key. Bypassa RLS: solo usar
// server-side (route handlers, server actions), nunca exponer al cliente.
//
// Instanciación perezosa: si se creara a nivel de módulo, Next.js fallaría
// al "recolectar datos de página" en el build apenas falten las env vars
// (antes de tener un proyecto Supabase real), tirando abajo todo el build.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return cached;
}
