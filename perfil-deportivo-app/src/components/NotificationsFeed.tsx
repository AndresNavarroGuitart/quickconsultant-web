"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsFeed({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markAsRead(id: string) {
    setBusyId(id);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyId(null);
    router.refresh();
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-slate-400">No tenés notificaciones.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`rounded-md border bg-white px-4 py-3 ${
            n.isRead
              ? "border-slate-200"
              : "border-slate-200 border-l-4 border-l-brand-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">{n.title}</p>
            <span className="text-xs text-slate-400">
              {new Date(n.createdAt).toLocaleDateString("es-AR")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{n.body}</p>
          {!n.isRead && (
            <button
              type="button"
              disabled={busyId === n.id}
              onClick={() => markAsRead(n.id)}
              className="mt-2 text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
            >
              Marcar como leída
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
