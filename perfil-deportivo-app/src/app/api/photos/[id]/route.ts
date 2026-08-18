import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

const BUCKET = "athlete-photos";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

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
