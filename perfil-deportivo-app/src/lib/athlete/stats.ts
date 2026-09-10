import { getAllStatsForSport, type StatDef } from "@/lib/athlete/sportsCatalog";

type MatchResult = "WIN" | "LOSS" | "DRAW";

export type MatchStatsValue = Record<string, number | boolean | null | undefined>;

// Forma estructural minima que necesitan las funciones de este archivo — no
// depende del tipo Match generado por Prisma para poder usarse tanto en
// server (datos crudos) como en componentes cliente (datos ya serializados
// a JSON, con fechas como string en vez de Date).
export type StatsMatchInput = {
  result: MatchResult;
  pointsScored: number;
  minutesPlayed: number | null;
  stats: MatchStatsValue | null;
};

export function computeMatchStats(
  matches: Pick<StatsMatchInput, "result" | "pointsScored">[]
) {
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

export type AggregatedStat = {
  def: StatDef;
  value: number; // suma (number), promedio (percent) o cantidad de veces (boolean)
};

// Estadisticas acumuladas para un conjunto de partidos (total, por club o
// por equipo rival). Recorre el catalogo del deporte y acumula segun el tipo
// de cada estadistica: number -> suma, percent -> promedio de los partidos
// que la tienen cargada, boolean -> cantidad de partidos en true.
export function computeDetailedStats(
  matches: StatsMatchInput[],
  sport: string | null | undefined
) {
  const base = computeMatchStats(matches);

  let minutesPlayed = 0;
  for (const match of matches) minutesPlayed += match.minutesPlayed ?? 0;

  const defs = getAllStatsForSport(sport);
  const aggregated: AggregatedStat[] = [];

  for (const def of defs) {
    if (def.type === "boolean") {
      let count = 0;
      for (const m of matches) if (m.stats?.[def.key] === true) count += 1;
      if (count > 0) aggregated.push({ def, value: count });
      continue;
    }

    if (def.type === "percent") {
      const values: number[] = [];
      for (const m of matches) {
        const v = m.stats?.[def.key];
        if (typeof v === "number") values.push(v);
      }
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        aggregated.push({ def, value: Math.round(avg * 10) / 10 });
      }
      continue;
    }

    // number
    let sum = 0;
    for (const m of matches) {
      const v = m.stats?.[def.key];
      if (typeof v === "number") sum += v;
    }
    if (sum > 0) aggregated.push({ def, value: sum });
  }

  return { ...base, minutesPlayed, aggregated };
}
