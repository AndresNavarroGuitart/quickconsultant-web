import { NextResponse } from "next/server";
import {
  getSessionContext,
  type SessionContext,
  type SessionDenial,
} from "@/lib/auth/getSessionContext";

type RequireSessionResult = { error: NextResponse } | { ctx: SessionContext };

const DENIAL_MESSAGES: Record<SessionDenial, string> = {
  blocked: "Tu cuenta está bloqueada. Escribinos si creés que es un error.",
  deleted: "Esta cuenta fue dada de baja.",
  terms: "Necesitás aceptar los Términos y Condiciones para continuar.",
};

// Punto único de rechazo para Route Handlers (los que no cuelgan del layout
// de (app)/(admin), que ya hacen este chequeo para las páginas). Antes,
// cada ruta llamaba a getSessionContext() directo y solo verificaba que
// hubiera sesión -- una cuenta bloqueada o dada de baja podía seguir
// operando /api/profile, /api/photos, /api/suggestions, etc. Usar esto (o
// requireGatedProfile/requireAdmin, que ya lo llaman) en cualquier ruta
// nueva en vez de llamar a getSessionContext() directo.
export async function requireSession({
  allowTermsPending = false,
}: { allowTermsPending?: boolean } = {}): Promise<RequireSessionResult> {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const denial = ctx.denial;
  if (denial && !(denial === "terms" && allowTermsPending)) {
    return {
      error: NextResponse.json(
        { error: DENIAL_MESSAGES[denial], reason: denial },
        { status: 403 }
      ),
    };
  }

  return { ctx };
}
