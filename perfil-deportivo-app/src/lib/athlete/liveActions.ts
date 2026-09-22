import {
  getPosition,
  getPositions,
  getSport,
  getStatsForPosition,
} from "@/lib/athlete/sportsCatalog";

// Registro de partido en vivo: cada boton suma 1 a una o mas estadisticas
// MANUALES del catalogo de esa posicion (mismas keys que el form de
// Partidos). Las calculadas (% de pases, % de duelos, duelos totales) se
// derivan solas al final y nunca se guardan.
//
// Para sumar otra posicion: agregar su lista abajo y registrarla en
// LIVE_ACTIONS con la key "<deporte>:<posicion>".

export type LiveIcon =
  | "ball"
  | "boot"
  | "head"
  | "shield"
  | "clear"
  | "goal"
  | "star"
  | "dribble"
  | "card_yellow"
  | "card_red";

// g* = escala de verdes (ganado/correcto), r* = escala de rojos
// (perdido/incorrecto), blue = acciones del jugador sin resultado, amber/red
// = tarjetas (con su color real, para reconocerlas de un vistazo).
export type LiveTone = "g1" | "g2" | "g3" | "r1" | "r2" | "r3" | "blue" | "amber" | "red";

export type LiveAction = {
  id: string;
  label: string;
  tone: LiveTone;
  icon: LiveIcon;
  // Marca chica sobre el logo para no depender solo del color.
  mark?: "ok" | "no";
  // Botones de la fila chica (4 por renglon).
  small?: boolean;
  adds: Record<string, number>;
};

// Clases completas (Tailwind no detecta nombres armados dinamicamente).
export const TONE_CLASSES: Record<LiveTone, { tile: string; badge: string }> = {
  g1: { tile: "border-green-300 bg-green-100 text-green-900", badge: "bg-green-600" },
  g2: { tile: "border-green-400 bg-green-200 text-green-900", badge: "bg-green-700" },
  g3: { tile: "border-green-500 bg-green-300 text-green-950", badge: "bg-green-800" },
  r1: { tile: "border-red-300 bg-red-100 text-red-900", badge: "bg-red-600" },
  r2: { tile: "border-red-400 bg-red-200 text-red-900", badge: "bg-red-700" },
  r3: { tile: "border-red-500 bg-red-300 text-red-950", badge: "bg-red-800" },
  blue: { tile: "border-blue-300 bg-blue-100 text-blue-900", badge: "bg-blue-600" },
  amber: { tile: "border-amber-300 bg-amber-100 text-amber-900", badge: "bg-amber-500" },
  red: { tile: "border-red-300 bg-red-100 text-red-900", badge: "bg-red-600" },
};

// Mismas acciones para las 5 posiciones de campo del futbol (Defensor
// Central, Lateral, Mediocampista, Enganche, Delantero): el mismo formato
// de datos (pases/duelos con % calculado solo, tarjetas, gambetas) aplica
// para cualquier posicion de campo, no solo para el defensor.
const FUTBOL_JUGADOR_DE_CAMPO: LiveAction[] = [
  { id: "pase_ok", label: "Pase correcto", tone: "g1", icon: "ball", mark: "ok", adds: { pases_intentados: 1, pases_correctos: 1 } },
  { id: "pase_mal", label: "Pase incorrecto", tone: "r1", icon: "ball", mark: "no", adds: { pases_intentados: 1 } },
  { id: "dt_ok", label: "Duelo terrestre ganado", tone: "g2", icon: "boot", mark: "ok", adds: { duelos_terrestres_disputados: 1, duelos_terrestres_ganados: 1 } },
  { id: "dt_mal", label: "Duelo terrestre perdido", tone: "r2", icon: "boot", mark: "no", adds: { duelos_terrestres_disputados: 1 } },
  { id: "da_ok", label: "Duelo aéreo ganado", tone: "g3", icon: "head", mark: "ok", adds: { duelos_aereos_disputados: 1, duelos_aereos_ganados: 1 } },
  { id: "da_mal", label: "Duelo aéreo perdido", tone: "r3", icon: "head", mark: "no", adds: { duelos_aereos_disputados: 1 } },
  { id: "interc", label: "Intercepción", tone: "blue", icon: "shield", adds: { intercepciones: 1 } },
  { id: "despeje", label: "Despeje", tone: "blue", icon: "clear", adds: { despejes: 1 } },
  { id: "gol", label: "Gol", tone: "blue", icon: "goal", small: true, adds: { goles: 1 } },
  { id: "asist", label: "Asistencia", tone: "blue", icon: "star", small: true, adds: { asistencias: 1 } },
  { id: "gambeta", label: "Gambeta", tone: "blue", icon: "dribble", small: true, adds: { gambetas: 1 } },
  { id: "amarilla", label: "Tarjeta amarilla", tone: "amber", icon: "card_yellow", small: true, adds: { tarjetas_amarillas: 1 } },
  { id: "roja", label: "Tarjeta roja", tone: "red", icon: "card_red", small: true, adds: { tarjetas_rojas: 1 } },
];

const FUTBOL_ARQUERO: LiveAction[] = [
  { id: "atajada", label: "Atajada", tone: "g1", icon: "shield", mark: "ok", adds: { llegadas: 1, atajadas: 1 } },
  { id: "gol_recibido", label: "Gol recibido", tone: "r1", icon: "shield", mark: "no", adds: { llegadas: 1, goles_recibidos: 1 } },
  { id: "penal_atajado", label: "Penal atajado", tone: "g2", icon: "goal", mark: "ok", adds: { penales_recibidos: 1, penales_atajados: 1 } },
  { id: "penal_convertido", label: "Penal convertido", tone: "r2", icon: "goal", mark: "no", adds: { penales_recibidos: 1, goles_recibidos: 1 } },
  { id: "mano_a_mano", label: "Mano a mano", tone: "blue", icon: "boot", small: true, adds: { mano_a_mano: 1 } },
  { id: "despeje_aereo", label: "Despeje aéreo", tone: "blue", icon: "clear", small: true, adds: { salidas_aereas: 1 } },
  { id: "pase_completado", label: "Pase completado", tone: "blue", icon: "ball", small: true, adds: { pases_completados: 1 } },
];

const LIVE_ACTIONS: Record<string, LiveAction[]> = {
  "futbol:arquero": FUTBOL_ARQUERO,
  "futbol:defensor_central": FUTBOL_JUGADOR_DE_CAMPO,
  "futbol:lateral": FUTBOL_JUGADOR_DE_CAMPO,
  "futbol:mediocampista": FUTBOL_JUGADOR_DE_CAMPO,
  "futbol:enganche": FUTBOL_JUGADOR_DE_CAMPO,
  "futbol:delantero": FUTBOL_JUGADOR_DE_CAMPO,
};

// Botones del modo en vivo para ese deporte + posicion, o null si esa
// posicion todavia no lo soporta.
export function getLiveActions(
  sport: string | null | undefined,
  position: string | null | undefined
): LiveAction[] | null {
  const s = getSport(sport)?.key;
  const p = getPosition(sport, position)?.key;
  if (!s || !p) return null;
  return LIVE_ACTIONS[`${s}:${p}`] ?? null;
}

// Posiciones de ese deporte que ya tienen modo en vivo.
export function getLivePositions(sport: string | null | undefined) {
  return getPositions(sport).filter((p) => getLiveActions(sport, p.key) !== null);
}

// Si hay que ofrecer el acceso al modo en vivo para este perfil: el deporte
// tiene alguna posicion soportada y la posicion del perfil (si la cargo)
// es una de ellas.
export function canUseLive(
  sport: string | null | undefined,
  profilePosition: string | null | undefined
): boolean {
  if (getLivePositions(sport).length === 0) return false;
  if (!profilePosition) return true;
  return getLiveActions(sport, profilePosition) !== null;
}

// Totales de estadisticas manuales de la posicion a partir de los toques
// registrados (todas arrancan en 0: en vivo, "0 toques" es un 0 real).
export function liveTotals(
  sport: string | null | undefined,
  position: string | null | undefined,
  events: string[]
): Record<string, number> {
  const actions = getLiveActions(sport, position) ?? [];
  const byId = new Map(actions.map((a) => [a.id, a]));
  const totals: Record<string, number> = {};
  for (const def of getStatsForPosition(sport, position)) {
    if (!def.formula && def.type === "number") totals[def.key] = 0;
  }
  for (const id of events) {
    const action = byId.get(id);
    if (!action) continue;
    for (const [key, n] of Object.entries(action.adds)) {
      totals[key] = (totals[key] ?? 0) + n;
    }
  }
  return totals;
}
