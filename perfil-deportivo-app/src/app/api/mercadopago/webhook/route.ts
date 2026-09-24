import { NextResponse } from "next/server";
import { PreApproval, Payment, WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import { mapSubscriptionStatus, mapPaymentStatus } from "@/lib/mercadopago/statusMaps";
import { isFreeSubscription } from "@/lib/admin/freeSubscription";
import { prisma } from "@/lib/prisma";
import type { Subscription } from "@/generated/prisma/client";

export const runtime = "nodejs";

// Encuentra la suscripción real (no la "gratis" que otorga a mano un admin,
// que no existe en MercadoPago y nunca debería recibir un pago) a la que
// asociar un pago de este usuario. Antes se usaba directo la más reciente
// de cualquier tipo (findFirst orderBy createdAt desc): si el usuario tenía
// una suscripción gratis más nueva que la real, o una PENDING abandonada,
// el pago quedaba colgado de la fila equivocada.
async function findRealSubscriptionForUser(userId: string): Promise<Subscription | null> {
  const subs = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return subs.find((s) => !isFreeSubscription(s.mercadopagoPreapprovalId)) ?? null;
}

async function recordPayment(
  subscription: Subscription,
  payment: {
    id: string | number;
    status: string;
    amount: number | null | undefined;
    currency: string | null | undefined;
    paidAt: string | null | undefined;
    rawPayload: object;
  }
) {
  await prisma.payment.upsert({
    where: { mercadopagoPaymentId: String(payment.id) },
    create: {
      subscriptionId: subscription.id,
      mercadopagoPaymentId: String(payment.id),
      status: mapPaymentStatus(payment.status),
      amount: payment.amount ?? 0,
      currency: payment.currency ?? subscription.currency,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
      rawPayload: payment.rawPayload,
    },
    update: {
      status: mapPaymentStatus(payment.status),
      paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
      rawPayload: payment.rawPayload,
    },
  });
}

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

    const existing = await prisma.subscription.findUnique({
      where: { mercadopagoPreapprovalId: dataId },
    });
    if (!existing) return NextResponse.json({ received: true });

    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: mapSubscriptionStatus(preapproval.status),
        // No pisa un startedAt que ya estaba seteado: cada renovación
        // autorizada volvía a escribir la hora actual acá.
        startedAt:
          existing.startedAt ?? (preapproval.status === "authorized" ? new Date() : undefined),
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
      ? await findRealSubscriptionForUser(payment.external_reference)
      : null;

    if (subscription && payment.id) {
      await recordPayment(subscription, {
        id: payment.id,
        status: payment.status ?? "pending",
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        paidAt: payment.date_approved,
        rawPayload: payment as object,
      });
    } else if (payment.id) {
      console.warn(
        `[mercadopago/webhook] pago ${payment.id} sin suscripción real donde asociarlo (external_reference: ${payment.external_reference ?? "ninguna"})`
      );
    }

    return NextResponse.json({ received: true });
  }

  if (type === "subscription_authorized_payment") {
    // Topico especifico de los cobros recurrentes de una preapproval (a
    // diferencia de "payment", que MercadoPago tambien puede mandar para
    // pagos sueltos). Su recurso trae el preapproval_id directo, asi que
    // permite asociar el pago sin depender de external_reference.
    const authorizedPayment = await fetchAuthorizedPayment(dataId);
    if (!authorizedPayment) return NextResponse.json({ received: true });

    const subscription = authorizedPayment.preapproval_id
      ? await prisma.subscription.findUnique({
          where: { mercadopagoPreapprovalId: authorizedPayment.preapproval_id },
        })
      : null;

    const paymentId = authorizedPayment.payment?.id ?? authorizedPayment.id;
    if (subscription && paymentId) {
      await recordPayment(subscription, {
        id: paymentId,
        status: authorizedPayment.payment?.status ?? authorizedPayment.status ?? "pending",
        amount: authorizedPayment.payment?.transaction_amount,
        currency: authorizedPayment.payment?.currency_id,
        paidAt: authorizedPayment.payment?.date_approved,
        rawPayload: authorizedPayment as object,
      });
    } else if (paymentId) {
      console.warn(
        `[mercadopago/webhook] cobro recurrente ${paymentId} sin preapproval_id resoluble (${authorizedPayment.preapproval_id ?? "ninguno"})`
      );
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

// La SDK de mercadopago no expone un cliente para este recurso: se llama
// directo a la API REST con el mismo access token. Si la forma de la
// respuesta no es la esperada, se loguea y se sigue sin romper el webhook
// (MercadoPago reintenta si devolvemos error, y esto no es crítico como
// para bloquear la respuesta 200).
type AuthorizedPaymentResource = {
  id?: string | number;
  status?: string;
  preapproval_id?: string;
  payment?: {
    id?: string | number;
    status?: string;
    transaction_amount?: number;
    currency_id?: string;
    date_approved?: string;
  };
};

async function fetchAuthorizedPayment(id: string): Promise<AuthorizedPaymentResource | null> {
  try {
    const res = await fetch(`https://api.mercadopago.com/authorized_payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    });
    if (!res.ok) {
      console.error(
        `[mercadopago/webhook] authorized_payments/${id} respondió ${res.status}`
      );
      return null;
    }
    return (await res.json()) as AuthorizedPaymentResource;
  } catch (err) {
    console.error(`[mercadopago/webhook] error consultando authorized_payments/${id}`, err);
    return null;
  }
}

export async function POST(request: Request) {
  return handleWebhook(request);
}

export async function GET(request: Request) {
  return handleWebhook(request);
}
