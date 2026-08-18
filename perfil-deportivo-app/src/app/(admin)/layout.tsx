import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/sugerencias", label: "Sugerencias" },
  { href: "/admin/notificaciones", label: "Notificaciones" },
];

export default async function AdminLayout({
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

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!dbUser.isAdmin) {
    redirect("/estadisticas");
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="shrink-0">
              <Logo />
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-accent-600">
                Admin
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/estadisticas"
                className="text-sm font-medium text-slate-500 hover:text-brand-700"
              >
                Volver a la app
              </Link>
              <LogoutButton />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            {ADMIN_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-slate-700 transition-colors hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
