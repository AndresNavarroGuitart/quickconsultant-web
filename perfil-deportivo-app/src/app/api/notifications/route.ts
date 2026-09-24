import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const notifications = await prisma.notification.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== ctx.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ notification: updated });
}
