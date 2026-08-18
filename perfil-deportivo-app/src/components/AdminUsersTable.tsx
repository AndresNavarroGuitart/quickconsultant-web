"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  trialEndsAt: string;
  createdAt: string;
};

export default function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendAction(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setBusyId(null);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      setError(
        typeof responseBody.error === "string"
          ? responseBody.error
          : "No se pudo actualizar el usuario"
      );
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Prueba hasta</th>
              <th className="px-4 py-2">Alta</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.isAdmin ? "Sí" : "No"}</td>
                <td className="px-4 py-2">
                  {new Date(u.trialEndsAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-2">
                  {new Date(u.createdAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        sendAction(u.id, { action: "extendTrial", days: 30 })
                      }
                      className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
                    >
                      +30 días
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => sendAction(u.id, { action: "revokeAccess" })}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                      Revocar acceso
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        sendAction(u.id, { action: "setAdmin", value: !u.isAdmin })
                      }
                      className="text-xs font-medium text-accent-600 hover:underline disabled:opacity-60"
                    >
                      {u.isAdmin ? "Quitar admin" : "Hacer admin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={5}>
                  Todavía no hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
