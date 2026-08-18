import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BUCKET = "athlete-photos";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SLOTS = new Set(["avatar", "match"]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const slot = formData.get("slot");
  const matchId = formData.get("matchId");
  const caption = formData.get("caption");

  if (!(file instanceof File) || typeof slot !== "string" || !SLOTS.has(slot)) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (slot === "match") {
    if (typeof matchId !== "string" || !matchId) {
      return NextResponse.json({ error: "Falta el partido" }, { status: 400 });
    }
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.athleteProfileId !== profile.id) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato de imagen no soportado (usá jpg, png o webp)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el tamaño máximo de 10MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${ctx.user.id}/${slot}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const supabaseAdmin = getSupabaseAdmin();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  if (slot === "avatar") {
    await prisma.athleteProfile.update({
      where: { userId: ctx.user.id },
      data: { avatarUrl: publicUrl },
    });
    return NextResponse.json({ url: publicUrl });
  }

  const photo = await prisma.photo.create({
    data: {
      athleteProfileId: profile.id,
      matchId: matchId as string,
      storagePath: path,
      url: publicUrl,
      caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
