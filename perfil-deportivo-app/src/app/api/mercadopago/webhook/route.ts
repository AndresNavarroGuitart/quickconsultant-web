import { NextResponse } from "next/server";
import { PreApproval, Payment, WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import { mapSubscriptionStatus, mapPaymentStatus } from "@/lib/mercadopago/statusMaps";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function handleWebhook(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    // Sin secret configurado no podemos verificar la firma: rechazamos en
    // vez de procesar notificaciones sin autenticar.
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: err.reason }, { status: 401 });
    }
    throw err;
  }

  if (!dataId || !type) {
    // Notificación sin los datos mínimos para procesar (ej. un ping de
    // prueba): confirmamos recepción sin hacer nada.
    return NextResponse.json({ received: true });
  }

  const config = getMercadoPagoConfig();

  if (type === "subscription_preapproval" || type === "preapproval") {
    const preapproval = await new PreApproval(config).get({ id: dataId });

    await prisma.subscription.updateMany({
      where: { mercadopagoPreapprovalId: dataId },
      data: {
        status: mapSubscriptionStatus(preapproval.status),
        startedAt: preapproval.status === "authorized" ? new Date() : undefined,
        nextPaymentDate: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : null,
        cancelledAt: preapproval.status === "cancelled" ? new Date() : null,
      },
    });

    return NextResponse.json({ received: true });
  }

  if (type === "payment") {
    const payment = await new Payment(config).get({ id: dataId });

    const subscription = payment.external_reference
      ? await prisma.subscription.findFirst({
          where: { userId: payment.external_reference },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (subscription && payment.id) {
      await prisma.payment.upsert({
        where: { mercadopagoPaymentId: String(payment.id) },
        create: {
          subscriptionId: subscription.id,
          mercadopagoPaymentId: String(payment.id),
          status: mapPaymentStatus(payment.status),
          amount: payment.transaction_amount ?? 0,
          currency: payment.currency_id ?? subscription.currency,
          paidAt: payment.date_approved ? new Date(payment.date_approved) : null,
          rawPayload: payment as object,
        },
        update: {
          status: mapPaymentStatus(payment.status),
          paidAt: payment.date_approved ? new Date(payment.date_approved) : null,
          rawPayload: payment as object,
        },
      });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  return handleWebhook(request);
}

export async function GET(request: Request) {
  return handleWebhook(request);
}
