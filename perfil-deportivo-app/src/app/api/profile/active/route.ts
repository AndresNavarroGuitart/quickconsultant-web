import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  ACTIVE_PROFILE_COOKIE,
  ACTIVE_PROFILE_COOKIE_OPTIONS,
  getSessionContext,
} from "@/lib/auth/getSessionContext";

const bodySchema = z.object({ profileId: z.string().uuid() });

// Cambia cuál de los perfiles de la cuenta está activo en esta sesión de
// navegador (cookie, no un campo de la cuenta: cada dispositivo puede estar
// viendo un perfil distinto).
export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = ctx.profiles.find((p) => p.id === parsed.data.profileId);
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profile.id, ACTIVE_PROFILE_COOKIE_OPTIONS);

  return NextResponse.json({ profile });
}
