// Pesos de puntos y niveles de "Racha Potrero" (gamificación). Los mismos
// puntos y niveles aplican para cualquier deporte de la app.

export const POINTS = {
  profileComplete: 20,
  club: 20,
  matchManual: 25,
  matchLive: 50,
  photo: 10,
} as const;

export type LevelName = "Regional" | "Nacional" | "Liga" | "Champions League";

// Umbral = puntos minimos para estar en ese nivel. El ultimo no tiene techo.
const LEVELS: { name: LevelName; min: number }[] = [
  { name: "Regional", min: 0 },
  { name: "Nacional", min: 200 },
  { name: "Liga", min: 700 },
  { name: "Champions League", min: 1500 },
];

export type LevelProgress = {
  name: LevelName;
  next: LevelName | null;
  pointsToNext: number | null;
  progressPct: number;
};

export function levelForPoints(points: number): LevelProgress {
  let currentIndex = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) currentIndex = i;
  }
  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1] ?? null;

  if (!next) {
    return { name: current.name, next: null, pointsToNext: null, progressPct: 100 };
  }

  const progressPct = Math.round(
    ((points - current.min) / (next.min - current.min)) * 100
  );

  return {
    name: current.name,
    next: next.name,
    pointsToNext: next.min - points,
    progressPct: Math.max(0, Math.min(100, progressPct)),
  };
}

// Campos del perfil que definen "perfil completo" para el bonus de puntos y
// el logro "Perfil 100%". displayName y sport ya son obligatorios desde el
// alta, asi que no suman nada distinguir por ellos.
export type ProfileCompletionFields = {
  position: string | null;
  birthDate: Date | null;
  heightCm: number | null;
  country: string | null;
  avatarUrl: string | null;
};

export function isProfileComplete(profile: ProfileCompletionFields): boolean {
  return (
    !!profile.position &&
    !!profile.birthDate &&
    !!profile.heightCm &&
    !!profile.country &&
    !!profile.avatarUrl
  );
}

export type PointsBreakdown = {
  profileComplete: boolean;
  clubs: number;
  matchesManual: number;
  matchesLive: number;
  photos: number;
};

export function computeTotalPoints(b: PointsBreakdown): number {
  return (
    (b.profileComplete ? POINTS.profileComplete : 0) +
    b.clubs * POINTS.club +
    b.matchesManual * POINTS.matchManual +
    b.matchesLive * POINTS.matchLive +
    b.photos * POINTS.photo
  );
}
