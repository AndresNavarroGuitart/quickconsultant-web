import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import PartidosManager from "@/components/PartidosManager";

export default async function PartidosPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (!profile) redirect("/onboarding");

  const [matches, athleteClubs] = await Promise.all([
    prisma.match.findMany({
      where: { athleteProfileId: profile.id },
      include: { club: true, photos: { orderBy: { createdAt: "desc" } } },
      orderBy: { matchDate: "desc" },
    }),
    prisma.athleteClub.findMany({
      where: { athleteProfileId: profile.id },
      include: { club: true },
      distinct: ["clubId"],
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Partidos</h1>
      <PartidosManager
        sport={profile.sport}
        initialMatches={matches.map((m) => ({
          id: m.id,
          opponent: m.opponent,
          matchDate: m.matchDate.toISOString(),
          result: m.result,
          condition: m.condition,
          pointsScored: m.pointsScored,
          notes: m.notes,
          isHighlight: m.isHighlight,
          position: m.position,
          minutesPlayed: m.minutesPlayed,
          cleanSheet: m.cleanSheet,
          saves: m.saves,
          successfulPasses: m.successfulPasses,
          oneOnOnes: m.oneOnOnes,
          goalsConceded: m.goalsConceded,
          penaltiesConceded: m.penaltiesConceded,
          penaltiesSaved: m.penaltiesSaved,
          duelsWon: m.duelsWon,
          aerialDuels: m.aerialDuels,
          recoveries: m.recoveries,
          interceptions: m.interceptions,
          dribbles: m.dribbles,
          assists: m.assists,
          goals: m.goals,
          fouls: m.fouls,
          yellowCards: m.yellowCards,
          redCards: m.redCards,
          headers: m.headers,
          penaltiesTaken: m.penaltiesTaken,
          club: m.club ? { id: m.club.id, name: m.club.name } : null,
          photos: m.photos.map((p) => ({ id: p.id, url: p.url })),
        }))}
        clubOptions={athleteClubs.map((ac) => ({
          id: ac.club.id,
          name: ac.club.name,
        }))}
      />
    </div>
  );
}
