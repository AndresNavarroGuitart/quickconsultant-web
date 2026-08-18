import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";

export async function requireAdmin() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (!ctx.dbUser.isAdmin) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { ctx };
}
