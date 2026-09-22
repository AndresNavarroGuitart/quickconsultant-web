import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { canUseLive } from "@/lib/athlete/liveActions";
import { prisma } from "@/lib/prisma";
import LiveMatchTracker from "@/components/LiveMatchTracker";

export default async function PartidoEnVivoPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = ctx.activeProfile;
  if (!profile) redirect("/onboarding");

  // El modo en vivo solo existe para algunas posiciones (por ahora Defensor
  // Central de futbol): el resto sigue cargando el partido desde Partidos.
  if (!canUseLive(profile.sport, profile.position)) redirect("/partidos");

  const [athleteClubs, championships] = await Promise.all([
    prisma.athleteClub.findMany({
      where: { athleteProfileId: profile.id },
      include: { club: true },
      distinct: ["clubId"],
    }),
    prisma.match.findMany({
      where: { athleteProfileId: profile.id, championship: { not: null } },
      select: { championship: true },
      orderBy: { matchDate: "desc" },
    }),
  ]);

  // Campeonatos ya cargados en partidos anteriores, del mas reciente al mas
  // viejo y sin repetidos.
  const seen = new Set<string>();
  const championshipSuggestions: string[] = [];
  for (const m of championships) {
    const name = m.championship?.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    championshipSuggestions.push(name);
  }

  return (
    <LiveMatchTracker
      profileId={profile.id}
      displayName={profile.displayName}
      sport={profile.sport}
      profilePosition={profile.position}
      clubOptions={athleteClubs.map((ac) => ({ id: ac.club.id, name: ac.club.name }))}
      championshipSuggestions={championshipSuggestions}
    />
  );
}
