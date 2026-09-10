import { z } from "zod";

// Las estadisticas del partido llegan como objeto { [statKey]: number|boolean }.
// El route las vuelve a filtrar contra el catalogo del deporte + posicion
// (sportsCatalog.ts) antes de guardar, asi que aca solo se valida la forma.
const statsRecord = z
  .record(
    z.string().max(80),
    z.union([z.number().finite().min(0).max(100000), z.boolean()])
  )
  .optional()
  .nullable();

export const matchSchema = z.object({
  opponent: z.string().trim().min(1).max(120),
  clubId: z.string().uuid().optional().nullable(),
  matchDate: z.coerce.date(),
  result: z.enum(["WIN", "LOSS", "DRAW"]),
  condition: z.enum(["LOCAL", "VISITANTE"]).optional().nullable(),
  pointsScored: z.coerce.number().int().min(0).max(10000).default(0),
  championship: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  position: z.string().trim().max(60).optional().nullable(),
  minutesPlayed: z.coerce.number().int().min(0).max(600).optional().nullable(),
  stats: statsRecord,
});

export const matchUpdateSchema = matchSchema.partial();
