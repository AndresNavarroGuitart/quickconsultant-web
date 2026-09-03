import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/athlete/getPublicProfile";
import { computeMatchStats } from "@/lib/athlete/stats";
import WavyBanner from "@/components/WavyBanner";

function formatDate(value: Date) {
  return value.toLocaleDateString("es-AR");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) return {};

  const title = `${profile.displayName} — ${profile.sport}`;
  const description =
    profile.bio?.slice(0, 160) ??
    `Perfil deportivo de ${profile.displayName} (${profile.sport}). Clubes, partidos y estadísticas.`;
  const images = profile.avatarUrl ? [profile.avatarUrl] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) notFound();

  const stats = computeMatchStats(profile.matches);
  const highlightMatches = profile.matches.filter((m) => m.isHighlight);
  const recentMatches = profile.matches.slice(0, 5);
  const matchPhotos = profile.matches.flatMap((m) => m.photos);

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="relative h-40 w-full overflow-hidden sm:h-56">
        {profile.coverUrl ? (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${profile.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <WavyBanner className="h-full w-full" />
        )}
      </div>

      <div className="mx-auto -mt-12 flex max-w-3xl flex-col gap-8 px-4">
        <div className="flex items-end gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-brand-100 text-2xl font-semibold text-brand-700 shadow-sm">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="pb-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {profile.displayName}
            </h1>
            <p className="text-sm text-slate-500">
              {profile.sport}
              {profile.location && ` · ${profile.location}`}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="whitespace-pre-line text-sm text-slate-700">
            {profile.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Partidos" value={stats.matchesPlayed} />
          <StatCard label="Puntos" value={stats.totalPoints} />
          <StatCard label="Ganados" value={stats.wins} />
          <StatCard label="Perdidos" value={stats.losses} />
        </div>

        {profile.athleteClubs.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Clubes</h2>
            <div className="flex flex-col gap-2">
              {profile.athleteClubs.map((ac) => (
                <div
                  key={ac.id}
                  className="rounded-md border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {ac.club.name}
                    {ac.club.city && (
                      <span className="text-slate-400"> · {ac.club.city}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(ac.startDate)} —{" "}
                    {ac.endDate ? formatDate(ac.endDate) : "actualidad"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {highlightMatches.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Partidos destacados
            </h2>
            <MatchList matches={highlightMatches} />
          </section>
        )}

        {recentMatches.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Últimos partidos
            </h2>
            <MatchList matches={recentMatches} />
          </section>
        )}

        {matchPhotos.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Fotos</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {matchPhotos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.caption ?? profile.displayName}
                  className="h-32 w-full rounded-md object-cover"
                />
              ))}
            </div>
          </section>
        )}

        <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Perfil hecho con Potrero Deportivo —{" "}
          <Link href="/signup" className="text-brand-600 hover:underline">
            creá el tuyo
          </Link>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  );
}

function MatchList({
  matches,
}: {
  matches: {
    id: string;
    opponent: string;
    matchDate: Date;
    result: "WIN" | "LOSS" | "DRAW";
    pointsScored: number;
    club: { name: string } | null;
  }[];
}) {
  const resultLabel = { WIN: "Ganado", LOSS: "Perdido", DRAW: "Empate" } as const;

  return (
    <div className="flex flex-col gap-2">
      {matches.map((m) => (
        <div
          key={m.id}
          className="rounded-md border border-slate-200 bg-white px-4 py-3"
        >
          <p className="text-sm font-medium text-slate-900">
            vs {m.opponent}{" "}
            <span
              className={
                m.result === "WIN"
                  ? "text-brand-600"
                  : m.result === "LOSS"
                    ? "text-red-600"
                    : "text-slate-500"
              }
            >
              ({resultLabel[m.result]})
            </span>
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(m.matchDate)}
            {m.club && ` · ${m.club.name}`} · {m.pointsScored} pts
          </p>
        </div>
      ))}
    </div>
  );
}
