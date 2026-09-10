"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  registrantName: string | null;
  profileCount: number;
  isAdmin: boolean;
  trialEndsAt: string;
  createdAt: string;
  deletedAt: string | null;
  blockedAt: string | null;
  hasFreeSubscription: boolean;
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
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Perfiles</th>
              <th className="px-4 py-2">Alta</th>
              <th className="px-4 py-2">Prueba hasta</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  {u.registrantName ?? (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {u.deletedAt ? (
                    <span
                      className="text-xs font-medium text-red-600"
                      title={new Date(u.deletedAt).toLocaleString("es-AR")}
                    >
                      Dada de baja el{" "}
                      {new Date(u.deletedAt).toLocaleDateString("es-AR")}
                    </span>
                  ) : u.blockedAt ? (
                    <span
                      className="text-xs font-medium text-orange-600"
                      title={new Date(u.blockedAt).toLocaleString("es-AR")}
                    >
                      Bloqueada el {new Date(u.blockedAt).toLocaleDateString("es-AR")}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Activa</span>
                  )}
                  {u.hasFreeSubscription && (
                    <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                      Suscripción gratis
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{u.isAdmin ? "Sí" : "No"}</td>
                <td className="px-4 py-2">{u.profileCount}</td>
                <td className="px-4 py-2">
                  {new Date(u.createdAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-2">
                  {new Date(u.trialEndsAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-2">
                  {u.deletedAt ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
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
                          sendAction(u.id, {
                            action: u.blockedAt ? "unblock" : "block",
                          })
                        }
                        className="text-xs font-medium text-orange-600 hover:underline disabled:opacity-60"
                      >
                        {u.blockedAt ? "Desbloquear acceso" : "Bloquear acceso"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() =>
                          sendAction(u.id, {
                            action: u.hasFreeSubscription
                              ? "revokeFreeSubscription"
                              : "grantFreeSubscription",
                          })
                        }
                        className="text-xs font-medium text-emerald-600 hover:underline disabled:opacity-60"
                      >
                        {u.hasFreeSubscription
                          ? "Quitar suscripción gratis"
                          : "Dar suscripción gratis"}
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
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={8}>
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
