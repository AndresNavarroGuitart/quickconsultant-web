import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { getAccessStatus } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";

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
  });

  return { user, dbUser, access };
}
