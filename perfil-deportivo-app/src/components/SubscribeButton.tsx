"use client";

import { useState } from "react";

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/mercadopago/checkout", { method: "POST" });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(typeof body.error === "string" ? body.error : "No se pudo iniciar el pago");
      return;
    }

    window.location.href = body.initPoint;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirigiendo a MercadoPago..." : "Suscribirme con MercadoPago"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
