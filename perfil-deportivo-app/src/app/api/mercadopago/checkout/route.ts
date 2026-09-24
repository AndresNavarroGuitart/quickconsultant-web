import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { requireSession } from "@/lib/auth/requireSession";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import { SUBSCRIPTION_AMOUNT as AMOUNT, SUBSCRIPTION_CURRENCY as CURRENCY } from "@/lib/mercadopago/pricing";
import { mapSubscriptionStatus } from "@/lib/mercadopago/statusMaps";
import { prisma } from "@/lib/prisma";

const PENDING_REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  // Evita duplicar suscripciones: cada POST creaba una preapproval nueva sin
  // mirar si ya había una vigente, así que dos pestañas, un doble click o
  // volver atrás desde MercadoPago podían terminar en dos suscripciones
  // autorizadas (y dos cobros mensuales).
  const existing = await prisma.subscription.findFirst({
    where: { userId: ctx.user.id, status: { in: ["AUTHORIZED", "PENDING"] } },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.status === "AUTHORIZED") {
    return NextResponse.json({ error: "Ya tenés una suscripción activa" }, { status: 409 });
  }

  if (
    existing?.status === "PENDING" &&
    existing.initPoint &&
    Date.now() - existing.createdAt.getTime() < PENDING_REUSE_WINDOW_MS
  ) {
    // Volvió a tocar "Suscribirme" con una pendiente reciente (cerró la
    // pestaña de MP, se arrepintió y volvió, etc.): le reusamos el mismo
    // checkout en vez de generarle una preapproval nueva.
    return NextResponse.json({ initPoint: existing.initPoint });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const preApproval = new PreApproval(getMercadoPagoConfig());

  let response;
  try {
    response = await preApproval.create({
      body: {
        reason: "Potrero Deportivo - Suscripción mensual",
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
      requestOptions: {
        // Mismo usuario + mismo día = misma key: si esta llamada se
        // reintenta (una carrera entre dos clicks casi simultáneos, un
        // timeout que en realidad sí llegó, etc.) MercadoPago devuelve la
        // preapproval que ya había creado en vez de una nueva.
        idempotencyKey: `sub-${ctx.user.id}-${new Date().toISOString().slice(0, 10)}`,
      },
    });
  } catch (err) {
    // No se filtra err.message al usuario: puede traer detalle interno de
    // MercadoPago (y a veces en inglés). Queda en el log del servidor.
    console.error(`[mercadopago/checkout] error creando preapproval para ${ctx.user.id}`, err);
    return NextResponse.json(
      { error: "No pudimos conectar con MercadoPago. Probá de nuevo en unos minutos." },
      { status: 502 }
    );
  }

  if (!response.id || !response.init_point) {
    console.error(
      `[mercadopago/checkout] respuesta sin id/init_point para ${ctx.user.id}`,
      response
    );
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
      initPoint: response.init_point,
      nextPaymentDate: response.next_payment_date
        ? new Date(response.next_payment_date)
        : null,
    },
  });

  return NextResponse.json({ initPoint: response.init_point });
}
