import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import NotificationsFeed from "@/components/NotificationsFeed";

export default async function NotificacionesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Notificaciones
      </h1>
      <NotificationsFeed
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
