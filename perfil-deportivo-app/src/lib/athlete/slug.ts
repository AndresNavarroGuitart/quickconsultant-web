import { prisma } from "@/lib/prisma";

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 60);

  return base || "atleta";
}

export async function generateUniqueSlug(displayName: string): Promise<string> {
  const base = slugify(displayName);
  let candidate = base;
  let suffix = 0;

  while (await prisma.athleteProfile.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
