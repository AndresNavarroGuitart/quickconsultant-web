import { prisma } from "@/lib/prisma";

// Club es una entidad global (varios atletas pueden compartir el mismo
// club). Se busca sin distinguir mayúsculas antes de crear uno nuevo, para
// no terminar con duplicados por capitalización distinta.
export async function findOrCreateClub(name: string, city?: string | null) {
  const existing = await prisma.club.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  return prisma.club.create({ data: { name, city: city ?? null } });
}
