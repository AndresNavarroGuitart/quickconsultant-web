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
  description: string;
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
      description: "Registraste tu primera accion en la app.",
      unlocked: i.totalPoints > 0,
    },
    {
      id: "constante",
      label: "Constante",
      description: "3 semanas seguidas con actividad.",
      unlocked: i.streakWeeks >= 3,
    },
    {
      id: "fotografo",
      label: "Fotógrafo",
      description: "Subiste al menos una foto.",
      unlocked: i.photos >= 1,
    },
    {
      id: "trotamundos",
      label: "Trotamundos",
      description: "Pasaste por 2 o más clubes.",
      unlocked: i.clubs >= 2,
    },
    {
      id: "perfil_completo",
      label: "Perfil 100%",
      description: "Completaste todos los datos de tu perfil.",
      unlocked: i.profileComplete,
    },
    {
      id: "cronista",
      label: "Cronista",
      description: "Cargaste 10 o más partidos.",
      unlocked: i.matchesTotal >= 10,
    },
  ];
}
