import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { prisma } from "@/lib/prisma";

// Marca la aceptacion de Terminos y Condiciones para la cuenta logueada.
// No pisa una fecha ya existente: aceptar de nuevo (ej. si el checkbox del
// gate se reenvia) no debe correr el timestamp original. allowTermsPending
// porque esta es justamente la ruta que tiene que poder llamar una cuenta
// que todavia no los acepto -- cualquier otro motivo de rechazo (bloqueo,
// baja) sigue aplicando igual.
export async function POST() {
  const result = await requireSession({ allowTermsPending: true });
  if ("error" in result) return result.error;
  const { ctx } = result;

  if (!ctx.dbUser.termsAcceptedAt) {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { termsAcceptedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
