const POSITIONS_BY_SPORT: Record<string, string[]> = {
  futbol: ["Arquero", "Defensor", "Lateral", "Mediocampista", "Delantero"],
  hockey: ["Arquero", "Defensor", "Mediocampista", "Delantero"],
  rugby: [
    "Pilar",
    "Hooker",
    "Segunda línea",
    "Ala",
    "Octavo",
    "Medio scrum",
    "Apertura",
    "Centro",
    "Wing",
    "Fullback",
  ],
  voley: ["Armador", "Central", "Punta", "Opuesto", "Líbero"],
  tenis: ["Individual"],
  natacion: ["Individual"],
};

const DEFAULT_POSITIONS = ["Titular", "Suplente"];

function normalizeSport(sport: string): string {
  return sport
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function getPositionsForSport(sport: string | null | undefined): string[] {
  if (!sport) return DEFAULT_POSITIONS;
  return POSITIONS_BY_SPORT[normalizeSport(sport)] ?? DEFAULT_POSITIONS;
}

export const GOALKEEPER_POSITION = "Arquero";
