"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AcceptTermsForm() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/terms/accept", { method: "POST" });

    setLoading(false);

    if (!res.ok) {
      setError("No se pudo registrar la aceptación. Probá de nuevo.");
      return;
    }

    router.push("/estadisticas");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4">
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        He leído y acepto los{" "}
        <Link
          href="/terminos"
          target="_blank"
          className="font-medium text-brand-600 hover:underline"
        >
          Términos y Condiciones
        </Link>
        .
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={!checked || loading}
        onClick={handleAccept}
        className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Aceptar y continuar"}
      </button>
    </div>
  );
}
