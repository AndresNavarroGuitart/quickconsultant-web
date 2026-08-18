import { ALL_STAT_FIELDS, type MatchStatKey } from "@/lib/athlete/positionStats";

type MatchResult = "WIN" | "LOSS" | "DRAW";

// Forma estructural minima que necesitan las funciones de este archivo — no
// depende del tipo Match generado por Prisma para poder usarse tanto en
// server (datos crudos) como en componentes cliente (datos ya serializados
// a JSON, con fechas como string en vez de Date).
export type StatsMatchInput = {
  result: MatchResult;
  pointsScored: number;
  minutesPlayed: number | null;
} & Partial<Record<MatchStatKey, number | boolean | null>>;

export function computeMatchStats(matches: Pick<StatsMatchInput, "result" | "pointsScored">[]) {
  const stats = {
    matchesPlayed: matches.length,
    totalPoints: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };

  for (const match of matches) {
    stats.totalPoints += match.pointsScored;
    if (match.result === "WIN") stats.wins += 1;
    else if (match.result === "LOSS") stats.losses += 1;
    else stats.draws += 1;
  }

  return stats;
}

// Estadisticas acumuladas para un conjunto de partidos (total, por club o
// por equipo rival): suma todos los campos de jugador de campo/arquero sin
// importar la posicion jugada en cada partido — asi un atleta que jugo de
// defensor y de delantero en distintos partidos ve el acumulado combinado.
export function computeDetailedStats(matches: StatsMatchInput[]) {
  const base = computeMatchStats(matches);

  let minutesPlayed = 0;
  let cleanSheets = 0;
  const statSums: Partial<Record<string, number>> = {};
  for (const field of ALL_STAT_FIELDS) {
    if (field.type === "number") statSums[field.key] = 0;
  }

  for (const match of matches) {
    minutesPlayed += match.minutesPlayed ?? 0;
    for (const field of ALL_STAT_FIELDS) {
      if (field.type === "boolean") {
        if (match[field.key]) cleanSheets += 1;
      } else {
        const value = match[field.key] as number | null | undefined;
        statSums[field.key] = (statSums[field.key] ?? 0) + (value ?? 0);
      }
    }
  }

  return { ...base, minutesPlayed, cleanSheets, statSums };
}
