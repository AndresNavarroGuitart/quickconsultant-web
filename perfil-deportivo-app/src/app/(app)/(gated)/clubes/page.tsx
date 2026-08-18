import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import { CLUB_ORDER_BY } from "@/lib/athlete/clubOrder";
import ClubesManager from "@/components/ClubesManager";

export default async function ClubesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (!profile) redirect("/onboarding");

  const athleteClubs = await prisma.athleteClub.findMany({
    where: { athleteProfileId: profile.id },
    include: { club: true },
    orderBy: CLUB_ORDER_BY,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Clubes</h1>
      <ClubesManager
        initialClubs={athleteClubs.map((ac) => ({
          id: ac.id,
          startDate: ac.startDate.toISOString(),
          endDate: ac.endDate ? ac.endDate.toISOString() : null,
          sport: ac.sport,
          league: ac.league,
          role: ac.role,
          jerseyNumber: ac.jerseyNumber,
          club: { id: ac.club.id, name: ac.club.name, city: ac.club.city },
        }))}
      />
    </div>
  );
}
