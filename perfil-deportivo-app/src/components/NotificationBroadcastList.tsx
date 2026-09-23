"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type NotificationBroadcast = {
  key: string;
  ids: string[];
  title: string;
  body: string;
  createdAtLabel: string;
  recipients: { email: string; isRead: boolean }[];
};

export default function NotificationBroadcastList({
  broadcasts,
}: {
  broadcasts: NotificationBroadcast[];
}) {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(b: NotificationBroadcast) {
    setError(null);
    setEditingKey(b.key);
    setTitle(b.title);
    setBody(b.body);
  }

  async function saveEdit(b: NotificationBroadcast) {
    setBusyKey(b.key);
    setError(null);

    const res = await fetch("/api/admin/notifications/broadcast", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: b.ids, title, body }),
    });

    setBusyKey(null);

    if (!res.ok) {
      const resBody = await res.json().catch(() => ({}));
      setError(typeof resBody.error === "string" ? resBody.error : "No se pudo guardar");
      return;
    }

    setEditingKey(null);
    router.refresh();
  }

  async function handleDelete(b: NotificationBroadcast) {
    setBusyKey(b.key);
    setError(null);

    const res = await fetch("/api/admin/notifications/broadcast", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: b.ids }),
    });

    setBusyKey(null);

    if (!res.ok) {
      const resBody = await res.json().catch(() => ({}));
      setError(typeof resBody.error === "string" ? resBody.error : "No se pudo borrar");
      return;
    }

    if (openKey === b.key) setOpenKey(null);
    router.refresh();
  }

  if (broadcasts.length === 0) {
    return <p className="text-sm text-slate-400">Todavía no se envió ninguna.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {broadcasts.map((b) => {
        const readCount = b.recipients.filter((r) => r.isRead).length;
        const isOpen = openKey === b.key;
        const isEditing = editingKey === b.key;
        const isBusy = busyKey === b.key;

        return (
          <div key={b.key} className="rounded-md border border-slate-200 bg-white px-4 py-3">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  minLength={2}
                  maxLength={120}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  minLength={2}
                  maxLength={2000}
                  rows={2}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveEdit(b)}
                    disabled={isBusy || title.trim().length < 2 || body.trim().length < 2}
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    disabled={isBusy}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : b.key)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={`shrink-0 text-slate-400 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-slate-900">{b.title}</span>
                      <span className="ml-2 text-slate-500">{b.body}</span>
                    </span>
                  </button>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                    <span>{b.createdAtLabel}</span>
                    <span className="font-medium text-brand-600">
                      {readCount}/{b.recipients.length} leídas
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(b)}
                      className="font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                      {isBusy ? "Borrando..." : "Borrar"}
                    </button>
                  </span>
                </div>
                {isOpen && (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3">
                    {b.recipients.map((r, j) => (
                      <li key={j} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{r.email}</span>
                        <span
                          className={
                            r.isRead ? "font-medium text-brand-600" : "text-slate-400"
                          }
                        >
                          {r.isRead ? "Leída" : "Sin leer"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
