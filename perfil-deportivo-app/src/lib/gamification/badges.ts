export type BadgeId =
  | "primer_paso"
  | "constante"
  | "fotografo"
  | "trotamundos"
  | "perfil_completo"
  | "cronista";

export type Badge = {
  id: BadgeId;
  label: string;
  // Texto corto para la tarjeta del logro (no la descripcion larga).
  sub: string;
  unlocked: boolean;
};

export type BadgeInputs = {
  totalPoints: number;
  streakWeeks: number;
  photos: number;
  clubs: number;
  profileComplete: boolean;
  matchesTotal: number;
};

export function computeBadges(i: BadgeInputs): Badge[] {
  return [
    {
      id: "primer_paso",
      label: "Primer paso",
      sub: "Tu primera acción registrada",
      unlocked: i.totalPoints > 0,
    },
    {
      id: "constante",
      label: "Constante",
      sub: "3 semanas de racha",
      unlocked: i.streakWeeks >= 3,
    },
    {
      id: "fotografo",
      label: "Fotógrafo",
      sub: "Subiste una foto",
      unlocked: i.photos >= 1,
    },
    {
      id: "trotamundos",
      label: "Trotamundos",
      sub: "2 clubes distintos",
      unlocked: i.clubs >= 2,
    },
    {
      id: "perfil_completo",
      label: "Perfil 100%",
      sub: "Todos los datos cargados",
      unlocked: i.profileComplete,
    },
    {
      id: "cronista",
      label: "Cronista",
      sub: "10 partidos cargados",
      unlocked: i.matchesTotal >= 10,
    },
  ];
}
