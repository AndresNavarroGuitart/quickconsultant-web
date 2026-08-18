import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { composeNotificationSchema } from "@/lib/validation/adminSchema";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const parsed = composeNotificationSchema.safeParse(await request.json());
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
    return NextResponse.json({ notification, sentTo: 1 }, { status: 201 });
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, body })),
  });

  return NextResponse.json({ sentTo: users.length }, { status: 201 });
}
