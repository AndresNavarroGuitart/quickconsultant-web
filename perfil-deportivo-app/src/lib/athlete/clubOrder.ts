import type { Prisma } from "@/generated/prisma/client";

// Clubes "actuales" (sin endDate) primero, ordenados entre si por fecha de
// inicio mas reciente; despues los que ya terminaron, del mas reciente al
// mas antiguo.
export const CLUB_ORDER_BY: Prisma.AthleteClubOrderByWithRelationInput[] = [
  { endDate: { sort: "desc", nulls: "first" } },
  { startDate: "desc" },
];
