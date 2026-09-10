import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { getAccessStatus } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";

// Cookie de sesión (sin maxAge: se pierde al cerrar el navegador) que guarda
// cuál de los hasta 2 perfiles de la cuenta se está viendo/editando. Solo la
// lee el servidor (httpOnly: no hay ninguna razón para que JS del cliente la
// toque) y solo viaja por HTTPS en producción.
export const ACTIVE_PROFILE_COOKIE = "active_profile_id";
export const ACTIVE_PROFILE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Punto único usado por route handlers (que no están envueltos por el
// layout de (app)) para resolver sesión + fila de negocio + estado de acceso.
export async function getSessionContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await ensureUser(user);
  const activeSubscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "AUTHORIZED" },
  });

  const access = getAccessStatus({
    isAdmin: dbUser.isAdmin,
    trialEndsAt: dbUser.trialEndsAt,
    hasActiveSubscription: !!activeSubscription,
    isBlocked: !!dbUser.blockedAt,
  });

  // Hasta 2 perfiles por cuenta; el activo es el que marca la cookie de
  // sesión, o el más viejo (el primero que se creó) si no hay cookie o
  // apunta a un perfil que ya no es de este usuario.
  const profiles = await prisma.athleteProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const cookieStore = await cookies();
  const requestedProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  const activeProfile =
    profiles.find((p) => p.id === requestedProfileId) ?? profiles[0] ?? null;

  return { user, dbUser, access, profiles, activeProfile };
}
