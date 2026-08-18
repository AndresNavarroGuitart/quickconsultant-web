import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import RecentFormStrip from "@/components/RecentFormStrip";
import EstadisticasManager from "@/components/EstadisticasManager";

export default async function EstadisticasPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (!profile) redirect("/onboarding");

  const { hasAccess, trialActive } = ctx.access;

  const matches = await prisma.match.findMany({
    where: { athleteProfileId: profile.id },
    include: { club: true },
    orderBy: { matchDate: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Estadísticas</h1>

      {!hasAccess && (
        <div className="rounded-md border border-slate-200 border-l-4 border-l-accent-500 bg-white px-4 py-3 text-sm text-slate-700">
          Tu prueba gratuita terminó. Activá tu suscripción para volver a
          cargar clubes y partidos.
        </div>
      )}
      {hasAccess && trialActive && !ctx.dbUser.isAdmin && (
        <div className="rounded-md border border-slate-200 border-l-4 border-l-brand-500 bg-white px-4 py-3 text-sm text-slate-700">
          Estás en período de prueba hasta el{" "}
          {ctx.dbUser.trialEndsAt.toLocaleDateString("es-AR")}.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700">Últimos partidos</p>
        <RecentFormStrip
          matches={matches.slice(0, 5).map((m) => ({
            id: m.id,
            opponent: m.opponent,
            result: m.result,
            club: m.club ? { name: m.club.name, logoUrl: m.club.logoUrl } : null,
          }))}
        />
      </div>

      <EstadisticasManager
        matches={matches.map((m) => ({
          id: m.id,
          opponent: m.opponent,
          matchDate: m.matchDate.toISOString(),
          result: m.result,
          pointsScored: m.pointsScored,
          minutesPlayed: m.minutesPlayed,
          club: m.club ? { id: m.club.id, name: m.club.name } : null,
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
        }))}
      />
    </div>
  );
}
