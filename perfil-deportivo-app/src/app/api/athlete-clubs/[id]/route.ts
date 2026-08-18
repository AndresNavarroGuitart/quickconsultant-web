import { NextResponse } from "next/server";
import { requireGatedProfile } from "@/lib/auth/requireGatedProfile";
import { athleteClubUpdateSchema } from "@/lib/validation/clubSchema";
import { findOrCreateClub } from "@/lib/clubs/findOrCreateClub";
import { prisma } from "@/lib/prisma";

async function loadOwned(id: string, athleteProfileId: string) {
  const athleteClub = await prisma.athleteClub.findUnique({ where: { id } });
  if (!athleteClub || athleteClub.athleteProfileId !== athleteProfileId) return null;
  return athleteClub;
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

  const parsed = athleteClubUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clubName, city, ...rest } = parsed.data;
  const clubId = clubName ? (await findOrCreateClub(clubName, city)).id : undefined;

  const athleteClub = await prisma.athleteClub.update({
    where: { id },
    data: { ...rest, ...(clubId ? { clubId } : {}) },
    include: { club: true },
  });

  return NextResponse.json({ athleteClub });
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

  await prisma.athleteClub.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
