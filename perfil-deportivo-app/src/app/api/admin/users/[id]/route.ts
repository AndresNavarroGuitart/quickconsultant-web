import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { adminUserActionSchema } from "@/lib/validation/adminSchema";
import { freeSubscriptionId } from "@/lib/admin/freeSubscription";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const { id } = await params;
  const parsed = adminUserActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
    return NextResponse.json({ user });
  }

  if (parsed.data.action === "revokeFreeSubscription") {
    await prisma.subscription.updateMany({
      where: { mercadopagoPreapprovalId: freeSubscriptionId(id) },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
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
  return NextResponse.json({ user });
}
