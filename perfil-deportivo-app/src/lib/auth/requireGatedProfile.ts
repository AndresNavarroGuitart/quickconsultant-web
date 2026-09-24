import { NextResponse } from "next/server";
import type { SessionContext } from "@/lib/auth/getSessionContext";
import { requireSession } from "@/lib/auth/requireSession";

type RequireGatedProfileResult =
  | { error: NextResponse }
  | { ctx: SessionContext; profile: NonNullable<SessionContext["activeProfile"]> };

// Usado por las API routes de clubes/partidos: exige sesión sin bloqueo/baja/
// terminos pendientes (ver requireSession), acceso activo (trial o
// suscripción) y un perfil activo (de los hasta 2 de la cuenta, según la
// cookie de sesión). Devuelve el error de respuesta listo para retornar, o
// el contexto + perfil si todo está ok.
export async function requireGatedProfile(): Promise<RequireGatedProfileResult> {
  const result = await requireSession();
  if ("error" in result) return result;
  const { ctx } = result;

  if (!ctx.access.hasAccess) {
    return {
      error: NextResponse.json(
        { error: "Requiere suscripción activa o trial vigente" },
        { status: 403 }
      ),
    };
  }

  if (!ctx.activeProfile) {
    return { error: NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 }) };
  }

  return { ctx, profile: ctx.activeProfile };
}
