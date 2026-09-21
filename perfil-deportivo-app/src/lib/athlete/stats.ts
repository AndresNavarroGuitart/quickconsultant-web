import { getAllStatsForSport, type StatDef } from "@/lib/athlete/sportsCatalog";

type MatchResult = "WIN" | "LOSS" | "DRAW" | "NOT_STARTED";

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
    matchesPlayed: 0,
    totalPoints: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };

  // Los partidos "Sin iniciar" todavia no se jugaron: no cuentan como
  // jugados ni suman a ganados/perdidos/empatados/puntos.
  for (const match of matches) {
    if (match.result === "NOT_STARTED") continue;
    stats.matchesPlayed += 1;
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
  // Los partidos "Sin iniciar" no aportan minutos ni estadisticas todavia.
  const played = matches.filter((m) => m.result !== "NOT_STARTED");
  const base = computeMatchStats(played);

  let minutesPlayed = 0;
  for (const match of played) minutesPlayed += match.minutesPlayed ?? 0;

  const defs = getAllStatsForSport(sport);
  const aggregated: AggregatedStat[] = [];

  for (const def of defs) {
    // Estadisticas calculadas: se derivan de los componentes acumulados (ej.
    // % de pases = total correctos / total intentados), no de promediar los
    // porcentajes de cada partido, que le daria el mismo peso a un partido
    // de 10 pases que a uno de 60.
    const formula = def.formula;
    if (formula) {
      if (formula.kind === "sum") {
        let sum = 0;
        for (const m of played) {
          for (const k of formula.of) {
            const v = m.stats?.[k];
            if (typeof v === "number") sum += v;
          }
        }
        if (sum > 0) aggregated.push({ def, value: sum });
      } else {
        let part = 0;
        let whole = 0;
        for (const m of played) {
          let matchWhole = 0;
          let hasWhole = false;
          for (const k of formula.whole) {
            const v = m.stats?.[k];
            if (typeof v === "number") {
              matchWhole += v;
              hasWhole = true;
            }
          }
          if (!hasWhole) continue;
          whole += matchWhole;
          for (const k of formula.part) {
            const v = m.stats?.[k];
            if (typeof v === "number") part += v;
          }
        }
        if (whole > 0) {
          aggregated.push({
            def,
            value: Math.round(Math.min((part / whole) * 100, 100) * 10) / 10,
          });
        }
      }
      continue;
    }

    if (def.type === "boolean") {
      let count = 0;
      for (const m of played) if (m.stats?.[def.key] === true) count += 1;
      if (count > 0) aggregated.push({ def, value: count });
      continue;
    }

    if (def.type === "percent") {
      const values: number[] = [];
      for (const m of played) {
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
    for (const m of played) {
      const v = m.stats?.[def.key];
      if (typeof v === "number") sum += v;
    }
    if (sum > 0) aggregated.push({ def, value: sum });
  }

  return { ...base, minutesPlayed, aggregated };
}
