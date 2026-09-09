"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CONFIRM_WORD = "ELIMINAR";

// "Zona de peligro" en Mi Perfil: baja de cuenta autogestionada. Requiere
// escribir una palabra exacta antes de habilitar el botón (mismo patrón que
// un checkbox obligatorio, pero más difícil de tocar sin querer dado lo
// irreversible de la acción). El detalle de qué se borra vive en
// /api/account/delete -> deleteAccount.ts.
export default function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: confirmText }),
    });

    if (!res.ok) {
      setLoading(false);
      const body = await res.json().catch(() => ({}));
      setError(
        typeof body.error === "string" ? body.error : "No se pudo dar de baja la cuenta"
      );
      return;
    }

    // Limpia también la sesión del lado del browser (localStorage) antes de
    // salir; el servidor ya cortó la cookie y borró el usuario de Auth.
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/cuenta-eliminada");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4">
      <div>
        <h2 className="text-sm font-semibold text-red-800">Zona de peligro</h2>
        <p className="mt-1 text-sm text-red-700">
          Dar de baja tu cuenta borra todos tus perfiles deportivos (el
          tuyo y el de cualquier hijo/a que hayas cargado), sus fotos,
          estadísticas de partidos, clubes y sugerencias. Es irreversible y
          no vas a poder volver a ingresar con este email. Tu historial de
          suscripción y pagos se conserva por obligaciones de facturación.
        </p>
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Dar de baja mi cuenta
        </button>
      )}

      {open && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-red-700">
            Para confirmar, escribí <strong>{CONFIRM_WORD}</strong>:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full max-w-xs rounded-md border border-red-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoComplete="off"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={confirmText !== CONFIRM_WORD || loading}
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Eliminando..." : "Eliminar mi cuenta definitivamente"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
