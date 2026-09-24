import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { cancelMercadoPagoSubscriptions } from "@/lib/mercadopago/cancelSubscriptions";
import { prisma } from "@/lib/prisma";

// Cancela la suscripción del usuario sin dar de baja la cuenta (botón
// "Cancelar suscripción" en /suscripcion). Antes esto solo existía como
// efecto colateral de borrar la cuenta entera.
export async function POST() {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const active = await prisma.subscription.findFirst({
    where: { userId: ctx.user.id, status: { in: ["AUTHORIZED", "PENDING", "PAUSED"] } },
  });
  if (!active) {
    return NextResponse.json(
      { error: "No tenés ninguna suscripción activa para cancelar" },
      { status: 404 }
    );
  }

  try {
    await cancelMercadoPagoSubscriptions(ctx.user.id);
  } catch (err) {
    console.error(`[mercadopago/cancel] no se pudo cancelar para ${ctx.user.id}`, err);
    return NextResponse.json(
      { error: "No pudimos cancelar la suscripción en MercadoPago. Probá de nuevo en unos minutos." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
