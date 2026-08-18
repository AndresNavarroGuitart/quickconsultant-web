import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { CLUB_ORDER_BY } from "@/lib/athlete/clubOrder";

// cache() dedupea la consulta entre generateMetadata y el render de la
// página para el mismo slug, dentro del mismo request.
export const getPublicProfile = cache(async (slug: string) => {
  return prisma.athleteProfile.findFirst({
    where: { slug, isPublic: true },
    include: {
      athleteClubs: { include: { club: true }, orderBy: CLUB_ORDER_BY },
      matches: {
        include: { club: true, photos: { orderBy: { createdAt: "desc" } } },
        orderBy: { matchDate: "desc" },
      },
    },
  });
});
