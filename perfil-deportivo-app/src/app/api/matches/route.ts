import { NextResponse } from "next/server";
import { requireGatedProfile } from "@/lib/auth/requireGatedProfile";
import { matchSchema } from "@/lib/validation/matchSchema";
import { computeMatchStats } from "@/lib/athlete/stats";
import { cleanStatsForPosition } from "@/lib/athlete/sportsCatalog";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const matches = await prisma.match.findMany({
    where: { athleteProfileId: result.profile.id },
    include: { club: true },
    orderBy: { matchDate: "desc" },
  });

  return NextResponse.json({ matches, stats: computeMatchStats(matches) });
}

export async function POST(request: Request) {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const parsed = matchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const position = parsed.data.position ?? null;
  const stats = cleanStatsForPosition(
    result.profile.sport,
    position,
    parsed.data.stats ?? null
  );

  const match = await prisma.match.create({
    data: {
      athleteProfileId: result.profile.id,
      clubId: parsed.data.clubId ?? null,
      opponent: parsed.data.opponent,
      matchDate: parsed.data.matchDate,
      result: parsed.data.result,
      condition: parsed.data.condition ?? null,
      pointsScored: parsed.data.pointsScored,
      homeScore: parsed.data.homeScore ?? null,
      awayScore: parsed.data.awayScore ?? null,
      championship: parsed.data.championship ?? null,
      notes: parsed.data.notes ?? null,
      position,
      minutesPlayed: parsed.data.minutesPlayed ?? null,
      stats,
    },
    include: { club: true },
  });

  return NextResponse.json({ match }, { status: 201 });
}
