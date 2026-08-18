import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import { mapSubscriptionStatus } from "@/lib/mercadopago/statusMaps";
import { prisma } from "@/lib/prisma";

// El monto/moneda son configurables por env porque MercadoPago liquida
// naturalmente en ARS: el usuario define acá el equivalente real a u$s10
// según cómo termine resolviendo esto con su cuenta de MercadoPago.
const AMOUNT = Number(process.env.MERCADOPAGO_SUBSCRIPTION_AMOUNT ?? "10");
const CURRENCY = process.env.MERCADOPAGO_SUBSCRIPTION_CURRENCY ?? "ARS";

export async function POST() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const preApproval = new PreApproval(getMercadoPagoConfig());

  let response;
  try {
    response = await preApproval.create({
      body: {
        reason: "Perfil Deportivo - Suscripción mensual",
        external_reference: ctx.user.id,
        payer_email: ctx.user.email,
        back_url: `${appUrl}/suscripcion`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: AMOUNT,
          currency_id: CURRENCY,
        },
        status: "pending",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de MercadoPago";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!response.id || !response.init_point) {
    return NextResponse.json(
      { error: "MercadoPago no devolvió una suscripción válida" },
      { status: 502 }
    );
  }

  await prisma.subscription.create({
    data: {
      userId: ctx.user.id,
      mercadopagoPreapprovalId: response.id,
      status: mapSubscriptionStatus(response.status),
      amount: AMOUNT,
      currency: CURRENCY,
      nextPaymentDate: response.next_payment_date
        ? new Date(response.next_payment_date)
        : null,
    },
  });

  return NextResponse.json({ initPoint: response.init_point });
}
