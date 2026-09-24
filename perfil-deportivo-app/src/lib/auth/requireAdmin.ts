import { NextResponse } from "next/server";
import type { SessionContext } from "@/lib/auth/getSessionContext";
import { requireSession } from "@/lib/auth/requireSession";

type RequireAdminResult = { error: NextResponse } | { ctx: SessionContext };

// Un admin bloqueado (ej. mientras se investiga un abuso) pierde acceso acá
// también, no solo al panel visual: antes esta función solo miraba
// isAdmin, así que un admin bloqueado conservaba acceso completo a
// /api/admin/* aunque el layout de (admin) lo redirigiera a
// /cuenta-bloqueada.
export async function requireAdmin(): Promise<RequireAdminResult> {
  const result = await requireSession();
  if ("error" in result) return result;
  const { ctx } = result;

  if (!ctx.dbUser.isAdmin) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { ctx };
}
