import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { composeNotificationSchema } from "@/lib/validation/adminSchema";
import { logAdminAction } from "@/lib/admin/logAdminAction";
import { readJson } from "@/lib/http/readJson";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const json = await readJson(request);
  if (json === undefined) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = composeNotificationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, body, targetEmail } = parsed.data;

  if (targetEmail) {
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) {
      return NextResponse.json({ error: "No existe un usuario con ese email" }, { status: 404 });
    }

    const notification = await prisma.notification.create({
      data: { userId: targetUser.id, title, body },
    });
    await logAdminAction({
      adminUserId: result.ctx.user.id,
      targetUserId: targetUser.id,
      action: "sendNotification",
      metadata: { title },
    });
    return NextResponse.json({ notification, sentTo: 1 }, { status: 201 });
  }

  // No a las cuentas dadas de baja: el email quedó anonimizado y no hay
  // nadie del otro lado que la vaya a leer.
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, body })),
  });

  await logAdminAction({
    adminUserId: result.ctx.user.id,
    action: "sendNotification",
    metadata: { title, broadcast: true, sentTo: users.length },
  });

  return NextResponse.json({ sentTo: users.length }, { status: 201 });
}
