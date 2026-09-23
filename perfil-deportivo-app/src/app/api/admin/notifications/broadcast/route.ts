import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  adminNotificationBroadcastDeleteSchema,
  adminNotificationBroadcastUpdateSchema,
} from "@/lib/validation/adminSchema";
import { logAdminAction } from "@/lib/admin/logAdminAction";
import { prisma } from "@/lib/prisma";

// Un envio (broadcast) son varias filas Notification (una por destinatario)
// que comparten title+body+createdAt. Editar/borrar actua sobre todas esas
// filas a la vez, identificadas por sus ids.

export async function PATCH(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const parsed = adminNotificationBroadcastUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, title, body } = parsed.data;

  const { count } = await prisma.notification.updateMany({
    where: { id: { in: ids } },
    data: { title, body },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }

  await logAdminAction({
    adminUserId: result.ctx.user.id,
    action: "updateNotificationBroadcast",
    metadata: { title, updated: count },
  });

  return NextResponse.json({ updated: count });
}

export async function DELETE(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const parsed = adminNotificationBroadcastDeleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids } = parsed.data;

  const { count } = await prisma.notification.deleteMany({
    where: { id: { in: ids } },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }

  await logAdminAction({
    adminUserId: result.ctx.user.id,
    action: "deleteNotificationBroadcast",
    metadata: { deleted: count },
  });

  return NextResponse.json({ deleted: count });
}
