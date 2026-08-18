export type MatchStatKey =
  | "cleanSheet"
  | "saves"
  | "successfulPasses"
  | "oneOnOnes"
  | "goalsConceded"
  | "penaltiesConceded"
  | "penaltiesSaved"
  | "duelsWon"
  | "aerialDuels"
  | "recoveries"
  | "interceptions"
  | "dribbles"
  | "assists"
  | "goals"
  | "fouls"
  | "yellowCards"
  | "redCards"
  | "headers"
  | "penaltiesTaken";

export type StatField = {
  key: MatchStatKey;
  label: string;
  type: "number" | "boolean";
};

// Estadisticas que se piden en el form de partidos según la posición
// elegida. Varias posiciones comparten la misma columna para conceptos
// equivalentes (goles, asistencias, gambetas, faltas, tarjetas).
export const POSITION_STAT_FIELDS: Record<string, StatField[]> = {
  Arquero: [
    { key: "cleanSheet", label: "Arco en cero", type: "boolean" },
    { key: "saves", label: "Paradas", type: "number" },
    { key: "successfulPasses", label: "Pases exitosos", type: "number" },
    { key: "oneOnOnes", label: "Mano a mano", type: "number" },
    { key: "goalsConceded", label: "Goles en contra", type: "number" },
    { key: "penaltiesConceded", label: "Penales en contra", type: "number" },
    { key: "penaltiesSaved", label: "Penales atajados", type: "number" },
  ],
  Defensor: [
    { key: "duelsWon", label: "Duelos ganados", type: "number" },
    { key: "aerialDuels", label: "Duelos aéreos", type: "number" },
    { key: "recoveries", label: "Recuperaciones", type: "number" },
    { key: "interceptions", label: "Intercepciones", type: "number" },
    { key: "dribbles", label: "Gambetas", type: "number" },
    { key: "assists", label: "Asistencias", type: "number" },
    { key: "goals", label: "Goles", type: "number" },
    { key: "fouls", label: "Faltas", type: "number" },
    { key: "yellowCards", label: "Tarjetas amarillas", type: "number" },
    { key: "redCards", label: "Tarjetas rojas", type: "number" },
  ],
  Delantero: [
    { key: "goals", label: "Goles", type: "number" },
    { key: "headers", label: "Cabezazos", type: "number" },
    { key: "assists", label: "Asistencias", type: "number" },
    { key: "dribbles", label: "Gambetas", type: "number" },
    { key: "fouls", label: "Faltas", type: "number" },
    { key: "yellowCards", label: "Tarjetas amarillas", type: "number" },
    { key: "redCards", label: "Tarjetas rojas", type: "number" },
    { key: "penaltiesTaken", label: "Penales ejecutados", type: "number" },
  ],
};

export function getStatFieldsForPosition(position: string | null): StatField[] {
  if (!position) return [];
  return POSITION_STAT_FIELDS[position] ?? [];
}

// Union de todos los campos de todas las posiciones, deduplicados por key —
// se usa para las estadísticas acumuladas (totales/por club/por equipo),
// donde interesa sumar todo sin importar en qué posición se jugó cada partido.
export const ALL_STAT_FIELDS: StatField[] = Object.values(POSITION_STAT_FIELDS)
  .flat()
  .filter((field, index, all) => all.findIndex((f) => f.key === field.key) === index);
