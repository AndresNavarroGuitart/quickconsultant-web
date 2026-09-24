import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { adminUserActionSchema } from "@/lib/validation/adminSchema";
import { freeSubscriptionId } from "@/lib/admin/freeSubscription";
import { logAdminAction } from "@/lib/admin/logAdminAction";
import { readJson } from "@/lib/http/readJson";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const { id } = await params;
  const json = await readJson(request);
  if (json === undefined) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = adminUserActionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Chequeo de existencia único, antes de cualquier accion: un id
  // inexistente (o mal copiado) tiraba distintos errores sin capturar mas
  // abajo -- violacion de FK en el upsert de suscripcion gratis, o
  // "Record not found" en el update/findUniqueOrThrow -- y ambos volvian
  // como 500 en vez de un 404 claro.
  const targetExists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!targetExists) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Las dos acciones de suscripción gratis tocan el modelo Subscription, no
  // un campo directo de User -- se resuelven aparte del resto.
  if (parsed.data.action === "grantFreeSubscription") {
    await prisma.subscription.upsert({
      where: { mercadopagoPreapprovalId: freeSubscriptionId(id) },
      create: {
        userId: id,
        mercadopagoPreapprovalId: freeSubscriptionId(id),
        status: "AUTHORIZED",
        amount: 0,
        currency: "FREE",
        startedAt: new Date(),
      },
      update: { status: "AUTHORIZED", cancelledAt: null },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    await logAdminAction({
      adminUserId: result.ctx.user.id,
      targetUserId: id,
      action: parsed.data.action,
    });
    return NextResponse.json({ user });
  }

  if (parsed.data.action === "revokeFreeSubscription") {
    await prisma.subscription.updateMany({
      where: { mercadopagoPreapprovalId: freeSubscriptionId(id) },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    await logAdminAction({
      adminUserId: result.ctx.user.id,
      targetUserId: id,
      action: parsed.data.action,
    });
    return NextResponse.json({ user });
  }

  const data =
    parsed.data.action === "extendTrial"
      ? { trialEndsAt: new Date(Date.now() + parsed.data.days * 24 * 60 * 60 * 1000) }
      : parsed.data.action === "revokeAccess"
        ? { trialEndsAt: new Date() }
        : parsed.data.action === "setAdmin"
          ? { isAdmin: parsed.data.value }
          : parsed.data.action === "block"
            ? { blockedAt: new Date() }
            : { blockedAt: null }; // unblock

  const user = await prisma.user.update({ where: { id }, data });
  await logAdminAction({
    adminUserId: result.ctx.user.id,
    targetUserId: id,
    action: parsed.data.action,
    metadata:
      parsed.data.action === "extendTrial"
        ? { days: parsed.data.days }
        : parsed.data.action === "setAdmin"
          ? { value: parsed.data.value }
          : undefined,
  });
  return NextResponse.json({ user });
}
