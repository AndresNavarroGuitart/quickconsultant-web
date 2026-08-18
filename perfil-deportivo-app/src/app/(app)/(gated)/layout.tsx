import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";

// Envuelve las secciones que requieren trial activo o suscripción paga
// (Clubes, Partidos). El resto de (app) (dashboard, perfil, suscripción,
// sugerencias, notificaciones) queda siempre accesible tras loguearse.
export default async function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.access.hasAccess) redirect("/suscripcion");

  return <>{children}</>;
}
