import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";
import PlayerCard from "@/components/PlayerCard";

export default async function PerfilPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });

  if (!profile) redirect("/onboarding");

  const currentClubs = await prisma.athleteClub.findMany({
    where: { athleteProfileId: profile.id, endDate: null },
    include: { club: true },
    orderBy: { startDate: "desc" },
    take: 2,
  });

  const { hasAccess } = ctx.access;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500">
          Perfil público:{" "}
          <span className="font-mono">/perfil/{profile.slug}</span>
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-[280px_1fr]">
        <PlayerCard
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          birthYear={profile.birthDate ? profile.birthDate.getFullYear() : null}
          position={profile.position}
          clubNames={currentClubs.map((ac) => ac.club.name)}
          country={profile.country}
          jerseyNumber={profile.jerseyNumber}
        />

        <ProfileForm
          profile={{
            displayName: profile.displayName,
            sport: profile.sport,
            location: profile.location,
            bio: profile.bio,
            birthDate: profile.birthDate
              ? profile.birthDate.toISOString().slice(0, 10)
              : null,
            position: profile.position,
            heightCm: profile.heightCm,
            country: profile.country,
            jerseyNumber: profile.jerseyNumber,
            subjectType: profile.subjectType,
            guardianName: profile.guardianName,
            guardianRelationship: profile.guardianRelationship,
          }}
          hasAccess={hasAccess}
        />
      </div>
    </div>
  );
}
