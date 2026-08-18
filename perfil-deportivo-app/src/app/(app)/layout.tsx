import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/perfil", label: "Mi perfil" },
  { href: "/clubes", label: "Clubes" },
  { href: "/partidos", label: "Partidos" },
  { href: "/sugerencias", label: "Sugerencias" },
  { href: "/suscripcion", label: "Suscripción" },
];

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
  const unreadNotifications = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/estadisticas" className="shrink-0">
              <Logo />
            </Link>
            {user.email && (
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.email}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-slate-700 transition-colors hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/notificaciones"
              className="text-sm font-bold text-slate-700 transition-colors hover:text-brand-700"
            >
              Notificaciones
              {unreadNotifications > 0 && (
                <span className="ml-1 rounded-full bg-accent-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {unreadNotifications}
                </span>
              )}
            </Link>
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
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
