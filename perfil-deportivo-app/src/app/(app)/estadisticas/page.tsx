import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";
import MatchHistoryCarousel from "@/components/MatchHistoryCarousel";
import MatchPhotoGallery from "@/components/MatchPhotoGallery";
import EstadisticasManager from "@/components/EstadisticasManager";

export default async function EstadisticasPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = ctx.activeProfile;
  if (!profile) redirect("/onboarding");

  const { hasAccess, trialActive } = ctx.access;

  const [matches, currentClubs, photos] = await Promise.all([
    prisma.match.findMany({
      where: { athleteProfileId: profile.id },
      include: { club: true },
      orderBy: { matchDate: "desc" },
    }),
    prisma.athleteClub.findMany({
      where: { athleteProfileId: profile.id, endDate: null },
      include: { club: true },
      orderBy: { startDate: "desc" },
      take: 2,
    }),
    prisma.photo.findMany({
      where: { athleteProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

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

      <ProfileSummaryCard
        avatarUrl={profile.avatarUrl}
        displayName={profile.displayName}
        sport={profile.sport}
        position={profile.position}
        clubNames={currentClubs.map((ac) => ac.club.name)}
        jerseyNumber={profile.jerseyNumber}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Historial de partidos</p>
          <Link
            href="/partidos"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700"
          >
            Ir a Partidos
          </Link>
        </div>
        <MatchHistoryCarousel
          matches={matches
            // La consulta trae los partidos del mas nuevo al mas viejo
            // (matchDate desc); acá se da vuelta para que la tira se lea de
            // fecha menor a mayor (el mas viejo a la izquierda, el mas
            // reciente a la derecha). MatchHistoryCarousel solo muestra los
            // ultimos de entrada y deja el resto scrolleable hacia la
            // izquierda.
            .slice()
            .reverse()
            .map((m) => ({
            id: m.id,
            opponent: m.opponent,
            matchDate: m.matchDate.toISOString(),
            result: m.result,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            club: m.club ? { name: m.club.name, logoUrl: m.club.logoUrl } : null,
          }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700">Galería de fotos</p>
        <MatchPhotoGallery
          photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
        />
      </div>

      <EstadisticasManager
        sport={profile.sport}
        matches={matches.map((m) => ({
          id: m.id,
          opponent: m.opponent,
          matchDate: m.matchDate.toISOString(),
          result: m.result,
          pointsScored: m.pointsScored,
          championship: m.championship,
          minutesPlayed: m.minutesPlayed,
          club: m.club ? { id: m.club.id, name: m.club.name } : null,
          stats: (m.stats ?? null) as Record<string, number | boolean> | null,
        }))}
      />
    </div>
  );
}
