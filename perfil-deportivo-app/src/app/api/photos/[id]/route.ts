import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

const BUCKET = "athlete-photos";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { athleteProfile: true },
  });

  if (!photo || photo.athleteProfile.userId !== ctx.user.id) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  await getSupabaseAdmin().storage.from(BUCKET).remove([photo.storagePath]);
  await prisma.photo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
