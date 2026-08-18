import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";

// Usado por las API routes de clubes/partidos: exige sesión, acceso activo
// (trial o suscripción) y un AthleteProfile ya creado. Devuelve el error de
// respuesta listo para retornar, o el contexto + perfil si todo está ok.
export async function requireGatedProfile() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  if (!ctx.access.hasAccess) {
    return {
      error: NextResponse.json(
        { error: "Requiere suscripción activa o trial vigente" },
        { status: 403 }
      ),
    };
  }

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 }) };
  }

  return { ctx, profile };
}
