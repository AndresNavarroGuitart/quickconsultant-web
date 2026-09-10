import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { prisma } from "@/lib/prisma";
import { MAX_PROFILES_PER_USER } from "@/lib/athlete/profileLimit";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";
import NotificationBadge from "@/components/NotificationBadge";
import ProfileNavMenu from "@/components/ProfileNavMenu";
import { BellIcon, EnvelopeIcon } from "@/components/icons";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await ensureUser(user);

  // Resguardo extra: el borrado del usuario de Supabase Auth ya corta el
  // acceso (ver deleteAccount.ts), esto cubre el caso de que esa llamada
  // haya fallado y la sesión vieja siga siendo válida.
  if (dbUser.deletedAt) {
    redirect("/cuenta-eliminada");
  }

  if (dbUser.blockedAt) {
    redirect("/cuenta-bloqueada");
  }

  if (!dbUser.termsAcceptedAt) {
    redirect("/aceptar-terminos");
  }

  const [unreadNotifications, profileCount] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.athleteProfile.count({ where: { userId: user.id } }),
  ]);
  const canAddProfile = profileCount < MAX_PROFILES_PER_USER;

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/estadisticas" className="shrink-0">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              {user.email && (
                <span className="hidden text-sm text-slate-500 sm:inline">
                  {user.email}
                </span>
              )}
              {dbUser.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-bold text-accent-600 transition-colors hover:text-accent-500"
                >
                  Admin
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            <ProfileNavMenu />

            <Link
              href="/suscripcion"
              className="text-sm font-bold text-slate-700 transition-colors hover:text-brand-700"
            >
              Mi suscripción
            </Link>

            {canAddProfile && (
              <Link
                href="/onboarding"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                Agregar perfil
              </Link>
            )}

            <div className="ml-auto flex items-center gap-4">
              <Link
                href="/notificaciones"
                className="relative text-slate-700 transition-colors hover:text-brand-700"
                title="Notificaciones"
                aria-label="Notificaciones"
              >
                <BellIcon className="h-6 w-6" />
                <NotificationBadge count={unreadNotifications} />
              </Link>

              <Link
                href="/sugerencias"
                className="text-slate-700 transition-colors hover:text-brand-700"
                title="Sugerencias"
                aria-label="Sugerencias"
              >
                <EnvelopeIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
