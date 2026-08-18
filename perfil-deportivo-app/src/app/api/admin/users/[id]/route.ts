import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { adminUserActionSchema } from "@/lib/validation/adminSchema";
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

  const data =
    parsed.data.action === "extendTrial"
      ? { trialEndsAt: new Date(Date.now() + parsed.data.days * 24 * 60 * 60 * 1000) }
      : parsed.data.action === "revokeAccess"
        ? { trialEndsAt: new Date() }
        : { isAdmin: parsed.data.value };

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}
