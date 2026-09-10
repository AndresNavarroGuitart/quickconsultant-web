"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";

const CONFIRM_WORD = "ELIMINAR";

// Baja de cuenta autogestionada: en la página solo se ve el botón, la
// descripción y la confirmación viven dentro del popup (antes estaban
// siempre visibles en la página, algo que quedaba muy pesado). El detalle
// de qué se borra vive en /api/account/delete -> deleteAccount.ts.
export default function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    if (loading) return;
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Dar de baja mi cuenta
      </button>

      <Modal open={open} onClose={closeModal} title="Dar de baja tu cuenta">
        <p className="text-sm text-slate-600">
          Esto borra todos tus perfiles deportivos (el tuyo y el de
          cualquier hijo/a que hayas cargado), sus fotos, estadísticas de
          partidos, clubes y sugerencias. Es irreversible y no vas a poder
          volver a ingresar con este email. Tu historial de suscripción y
          pagos se conserva por obligaciones de facturación.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm text-slate-700">
            Para confirmar, escribí <strong>{CONFIRM_WORD}</strong>:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoComplete="off"
            autoFocus
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={closeModal}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={confirmText !== CONFIRM_WORD || loading}
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Eliminando..." : "Eliminar mi cuenta definitivamente"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
