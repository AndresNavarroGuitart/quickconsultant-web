import { prisma } from "@/lib/prisma";
import {
  computeTotalPoints,
  isProfileComplete,
  levelForPoints,
  type LevelProgress,
} from "@/lib/gamification/points";
import { computeStreak, type StreakInfo } from "@/lib/gamification/streak";
import { computeBadges, type Badge } from "@/lib/gamification/badges";

export type GamificationStats = {
  totalPoints: number;
  level: LevelProgress;
  streak: StreakInfo;
  badges: Badge[];
  breakdown: {
    profileComplete: boolean;
    clubs: number;
    matchesManual: number;
    matchesLive: number;
    photos: number;
  };
};

// Todo lo de "Racha Potrero" para un perfil puntual: puntos, nivel, racha
// semanal y logros, calculado en vivo a partir de los datos reales (nada de
// esto se guarda aparte, asi que nunca puede desincronizarse).
export async function getGamificationStats(
  profileId: string
): Promise<GamificationStats> {
  const [profile, clubs, matches, photos] = await Promise.all([
    prisma.athleteProfile.findUnique({
      where: { id: profileId },
      select: {
        position: true,
        birthDate: true,
        heightCm: true,
        country: true,
        avatarUrl: true,
      },
    }),
    prisma.athleteClub.findMany({
      where: { athleteProfileId: profileId },
      select: { createdAt: true },
    }),
    prisma.match.findMany({
      where: { athleteProfileId: profileId },
      select: { source: true, createdAt: true },
    }),
    prisma.photo.findMany({
      where: { athleteProfileId: profileId },
      select: { createdAt: true },
    }),
  ]);

  const profileComplete = profile ? isProfileComplete(profile) : false;
  const matchesManual = matches.filter((m) => m.source === "MANUAL").length;
  const matchesLive = matches.filter((m) => m.source === "LIVE").length;

  const totalPoints = computeTotalPoints({
    profileComplete,
    clubs: clubs.length,
    matchesManual,
    matchesLive,
    photos: photos.length,
  });

  const activityDates = [
    ...clubs.map((c) => c.createdAt),
    ...matches.map((m) => m.createdAt),
    ...photos.map((p) => p.createdAt),
  ];
  const streak = computeStreak(activityDates);

  const badges = computeBadges({
    totalPoints,
    streakWeeks: streak.weeks,
    photos: photos.length,
    clubs: clubs.length,
    profileComplete,
    matchesTotal: matchesManual + matchesLive,
  });

  return {
    totalPoints,
    level: levelForPoints(totalPoints),
    streak,
    badges,
    breakdown: {
      profileComplete,
      clubs: clubs.length,
      matchesManual,
      matchesLive,
      photos: photos.length,
    },
  };
}

export type LeaderboardRow = {
  rank: number;
  points: number;
  isMe: boolean;
};

export type Leaderboard = {
  total: number;
  podium: LeaderboardRow[]; // puestos 1-3 (o menos si hay menos de 3 en total)
  nextRows: LeaderboardRow[]; // puestos 4-6
  me: LeaderboardRow;
  // Si el perfil ya aparece en podium/nextRows (puesto <= 6) no hace falta
  // mostrar su fila aparte con el "···" antes.
  meInList: boolean;
};

// Ranking anonimo de TODOS los perfiles activos (cuentas no borradas ni
// bloqueadas), ordenado por puntos. Nunca expone nombre, deporte ni ningun
// otro dato del perfil -- solo el puntaje y el puesto.
export async function getLeaderboard(profileId: string): Promise<Leaderboard> {
  const profiles = await prisma.athleteProfile.findMany({
    where: { user: { deletedAt: null, blockedAt: null } },
    select: {
      id: true,
      position: true,
      birthDate: true,
      heightCm: true,
      country: true,
      avatarUrl: true,
    },
  });

  const [clubCounts, matchCounts, photoCounts] = await Promise.all([
    prisma.athleteClub.groupBy({
      by: ["athleteProfileId"],
      _count: { _all: true },
    }),
    prisma.match.groupBy({
      by: ["athleteProfileId", "source"],
      _count: { _all: true },
    }),
    prisma.photo.groupBy({
      by: ["athleteProfileId"],
      _count: { _all: true },
    }),
  ]);

  const clubsById = new Map(clubCounts.map((c) => [c.athleteProfileId, c._count._all]));
  const photosById = new Map(photoCounts.map((p) => [p.athleteProfileId, p._count._all]));
  const matchesById = new Map<string, { manual: number; live: number }>();
  for (const m of matchCounts) {
    const entry = matchesById.get(m.athleteProfileId) ?? { manual: 0, live: 0 };
    if (m.source === "MANUAL") entry.manual += m._count._all;
    else entry.live += m._count._all;
    matchesById.set(m.athleteProfileId, entry);
  }

  const ranked = profiles
    .map((p) => {
      const m = matchesById.get(p.id) ?? { manual: 0, live: 0 };
      const points = computeTotalPoints({
        profileComplete: isProfileComplete(p),
        clubs: clubsById.get(p.id) ?? 0,
        matchesManual: m.manual,
        matchesLive: m.live,
        photos: photosById.get(p.id) ?? 0,
      });
      return { id: p.id, points };
    })
    .sort((a, b) => b.points - a.points)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const meIndex = ranked.findIndex((r) => r.id === profileId);
  const me: LeaderboardRow = meIndex >= 0
    ? { rank: ranked[meIndex].rank, points: ranked[meIndex].points, isMe: true }
    : { rank: ranked.length + 1, points: 0, isMe: true };

  const toRow = (r: (typeof ranked)[number]): LeaderboardRow => ({
    rank: r.rank,
    points: r.points,
    isMe: r.id === profileId,
  });

  const podium = ranked.slice(0, 3).map(toRow);
  const nextRows = ranked.slice(3, 6).map(toRow);

  return {
    total: ranked.length,
    podium,
    nextRows,
    me,
    meInList: me.rank <= 6,
  };
}
