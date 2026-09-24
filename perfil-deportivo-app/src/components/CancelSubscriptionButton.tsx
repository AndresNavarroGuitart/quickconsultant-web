"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Igual que "Finalizar partido" en el registro en vivo: el segundo toque
  // tiene que ser deliberado, así que se desarma solo si tarda demasiado.
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  async function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }

    setArmed(false);
    setLoading(true);
    setError(null);

    const res = await fetch("/api/mercadopago/cancel", { method: "POST" });
    const body = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(typeof body.error === "string" ? body.error : "No se pudo cancelar");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="self-start text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Cancelando..."
          : armed
            ? "¿Seguro? Tocá de nuevo para cancelar"
            : "Cancelar suscripción"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
