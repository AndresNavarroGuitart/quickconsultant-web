"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 7000;

// Al volver de MercadoPago el webhook todavía no llegó la mayoría de las
// veces, así que la página mostraba "prueba vencida, sin suscripción
// activa" un momento después de que el usuario acaba de pagar -- generaba
// ansiedad y reintentos. Este banner se refresca solo hasta que el server
// component deje de encontrar una suscripción PENDING reciente (ya sea
// porque se autorizó, o porque pasó la ventana de 30 minutos).
export default function PendingPaymentBanner() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
      Estamos confirmando tu pago con MercadoPago. Puede tardar un par de
      minutos — no hace falta que hagas nada más, esta página se actualiza
      sola.
    </div>
  );
}
