import { z } from "zod";

export const matchSchema = z.object({
  opponent: z.string().trim().min(1).max(120),
  clubId: z.string().uuid().optional().nullable(),
  matchDate: z.coerce.date(),
  result: z.enum(["WIN", "LOSS", "DRAW"]),
  condition: z.enum(["LOCAL", "VISITANTE"]).optional().nullable(),
  pointsScored: z.coerce.number().int().min(0).max(10000).default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
  isHighlight: z.boolean().optional(),
  position: z.string().trim().max(60).optional().nullable(),
  minutesPlayed: z.coerce.number().int().min(0).max(600).optional().nullable(),
  // Estadisticas de arquero: solo se completan cuando position es "Arquero",
  // pero se validan igual sin esa restricción (el form solo las manda en ese caso).
  cleanSheet: z.boolean().optional(),
  saves: z.coerce.number().int().min(0).max(200).optional().nullable(),
  successfulPasses: z.coerce.number().int().min(0).max(200).optional().nullable(),
  oneOnOnes: z.coerce.number().int().min(0).max(50).optional().nullable(),
  goalsConceded: z.coerce.number().int().min(0).max(50).optional().nullable(),
  penaltiesConceded: z.coerce.number().int().min(0).max(20).optional().nullable(),
  penaltiesSaved: z.coerce.number().int().min(0).max(20).optional().nullable(),
  // Estadisticas de jugador de campo (defensor/delantero): mismas columnas
  // para conceptos compartidos entre posiciones, ver positionStats.ts.
  duelsWon: z.coerce.number().int().min(0).max(99).optional().nullable(),
  aerialDuels: z.coerce.number().int().min(0).max(99).optional().nullable(),
  recoveries: z.coerce.number().int().min(0).max(99).optional().nullable(),
  interceptions: z.coerce.number().int().min(0).max(99).optional().nullable(),
  dribbles: z.coerce.number().int().min(0).max(99).optional().nullable(),
  assists: z.coerce.number().int().min(0).max(20).optional().nullable(),
  goals: z.coerce.number().int().min(0).max(20).optional().nullable(),
  fouls: z.coerce.number().int().min(0).max(20).optional().nullable(),
  yellowCards: z.coerce.number().int().min(0).max(2).optional().nullable(),
  redCards: z.coerce.number().int().min(0).max(1).optional().nullable(),
  headers: z.coerce.number().int().min(0).max(20).optional().nullable(),
  penaltiesTaken: z.coerce.number().int().min(0).max(10).optional().nullable(),
});

export const matchUpdateSchema = matchSchema.partial();
