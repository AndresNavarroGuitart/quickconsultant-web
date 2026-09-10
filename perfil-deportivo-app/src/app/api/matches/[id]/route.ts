import { NextResponse } from "next/server";
import { requireGatedProfile } from "@/lib/auth/requireGatedProfile";
import { matchUpdateSchema } from "@/lib/validation/matchSchema";
import { cleanStatsForPosition } from "@/lib/athlete/sportsCatalog";
import { prisma } from "@/lib/prisma";

async function loadOwned(id: string, athleteProfileId: string) {
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match || match.athleteProfileId !== athleteProfileId) return null;
  return match;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const { id } = await params;
  const existing = await loadOwned(id, result.profile.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = matchUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { stats, ...rest } = parsed.data;
  // La posicion efectiva del partido despues de este update (la nueva si
  // viene, si no la que ya tenia) define contra que set de stats limpiar.
  const position =
    rest.position !== undefined ? rest.position : existing.position;

  const match = await prisma.match.update({
    where: { id },
    data: {
      ...rest,
      ...(stats !== undefined
        ? {
            stats: cleanStatsForPosition(
              result.profile.sport,
              position,
              stats ?? null
            ),
          }
        : {}),
    },
    include: { club: true },
  });

  return NextResponse.json({ match });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireGatedProfile();
  if ("error" in result) return result.error;

  const { id } = await params;
  const existing = await loadOwned(id, result.profile.id);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
