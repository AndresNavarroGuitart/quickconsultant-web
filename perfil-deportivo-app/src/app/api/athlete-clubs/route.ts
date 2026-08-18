import { NextResponse } from "next/server";
import { requireGatedProfile } from "@/lib/auth/requireGatedProfile";
import { athleteClubSchema } from "@/lib/validation/clubSchema";
import { findOrCreateClub } from "@/lib/clubs/findOrCreateClub";
import { CLUB_ORDER_BY } from "@/lib/athlete/clubOrder";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const athleteClubs = await prisma.athleteClub.findMany({
    where: { athleteProfileId: result.profile.id },
    include: { club: true },
    orderBy: CLUB_ORDER_BY,
  });

  return NextResponse.json({ athleteClubs });
}

export async function POST(request: Request) {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const parsed = athleteClubSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const club = await findOrCreateClub(parsed.data.clubName, parsed.data.city);

  const athleteClub = await prisma.athleteClub.create({
    data: {
      athleteProfileId: result.profile.id,
      clubId: club.id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate ?? null,
      sport: parsed.data.sport,
      league: parsed.data.league ?? null,
      role: parsed.data.role ?? null,
      jerseyNumber: parsed.data.jerseyNumber ?? null,
    },
    include: { club: true },
  });

  return NextResponse.json({ athleteClub }, { status: 201 });
}
