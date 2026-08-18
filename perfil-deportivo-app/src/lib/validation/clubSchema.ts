import { z } from "zod";

export const athleteClubSchema = z.object({
  clubName: z.string().trim().min(2).max(120),
  city: z.string().trim().max(120).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  sport: z.string().trim().min(1).max(60),
  league: z.string().trim().max(120).optional().nullable(),
  role: z.string().trim().max(60).optional().nullable(),
  jerseyNumber: z.coerce.number().int().min(0).max(999).optional().nullable(),
});

export const athleteClubUpdateSchema = athleteClubSchema.partial();
