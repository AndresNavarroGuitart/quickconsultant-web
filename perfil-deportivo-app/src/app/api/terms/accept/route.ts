import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";

// Marca la aceptacion de Terminos y Condiciones para la cuenta logueada.
// No pisa una fecha ya existente: aceptar de nuevo (ej. si el checkbox del
// gate se reenvia) no debe correr el timestamp original.
export async function POST() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (!ctx.dbUser.termsAcceptedAt) {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { termsAcceptedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
