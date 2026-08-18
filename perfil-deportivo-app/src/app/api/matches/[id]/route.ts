import { NextResponse } from "next/server";
import { requireGatedProfile } from "@/lib/auth/requireGatedProfile";
import { matchUpdateSchema } from "@/lib/validation/matchSchema";
import { prisma } from "@/lib/prisma";

async function loadOwned(id: string, athleteProfileId: string) {
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match || match.athleteProfileId !== athleteProfileId) return null;
  return match;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const { id } = await params;
  const existing = await loadOwned(id, result.profile.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = matchUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id },
    data: parsed.data,
    include: { club: true },
  });

  return NextResponse.json({ match });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const { id } = await params;
  const existing = await loadOwned(id, result.profile.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
