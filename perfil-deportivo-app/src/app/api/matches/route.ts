import { NextResponse } from "next/server";
import { requireGatedProfile } from "@/lib/auth/requireGatedProfile";
import { matchSchema } from "@/lib/validation/matchSchema";
import { computeMatchStats } from "@/lib/athlete/stats";
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

  const match = await prisma.match.create({
    data: {
      athleteProfileId: result.profile.id,
      clubId: parsed.data.clubId ?? null,
      opponent: parsed.data.opponent,
      matchDate: parsed.data.matchDate,
      result: parsed.data.result,
      condition: parsed.data.condition ?? null,
      pointsScored: parsed.data.pointsScored,
      notes: parsed.data.notes ?? null,
      isHighlight: parsed.data.isHighlight ?? false,
      position: parsed.data.position ?? null,
      minutesPlayed: parsed.data.minutesPlayed ?? null,
      cleanSheet: parsed.data.cleanSheet ?? false,
      saves: parsed.data.saves ?? null,
      successfulPasses: parsed.data.successfulPasses ?? null,
      oneOnOnes: parsed.data.oneOnOnes ?? null,
      goalsConceded: parsed.data.goalsConceded ?? null,
      penaltiesConceded: parsed.data.penaltiesConceded ?? null,
      penaltiesSaved: parsed.data.penaltiesSaved ?? null,
      duelsWon: parsed.data.duelsWon ?? null,
      aerialDuels: parsed.data.aerialDuels ?? null,
      recoveries: parsed.data.recoveries ?? null,
      interceptions: parsed.data.interceptions ?? null,
      dribbles: parsed.data.dribbles ?? null,
      assists: parsed.data.assists ?? null,
      goals: parsed.data.goals ?? null,
      fouls: parsed.data.fouls ?? null,
      yellowCards: parsed.data.yellowCards ?? null,
      redCards: parsed.data.redCards ?? null,
      headers: parsed.data.headers ?? null,
      penaltiesTaken: parsed.data.penaltiesTaken ?? null,
    },
    include: { club: true },
  });

  return NextResponse.json({ match }, { status: 201 });
}
