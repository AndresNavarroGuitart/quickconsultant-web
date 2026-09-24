import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireSession } from "@/lib/auth/requireSession";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BUCKET = "athlete-photos";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SLOTS = new Set(["avatar", "match"]);
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 82;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

export async function POST(request: Request) {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const profile = ctx.activeProfile;
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

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Recodifica siempre del lado del servidor, sin confiar en el
  // Content-Type que declaró el cliente ni en que compressImage.ts (que
  // corre en el navegador y se saltea archivos livianos) haya hecho algo.
  // Dos efectos importantes de este paso:
  //  - Si el archivo no es en realidad una imagen decodificable, sharp tira
  //    y lo rechazamos acá -- antes solo se validaba el campo `type` que
  //    manda el cliente, que no prueba nada del contenido real.
  //  - .rotate() sin argumentos aplica la orientación EXIF y `.toBuffer()`
  //    no copia metadatos salvo que se pida explícitamente con
  //    `.withMetadata()`: los datos EXIF/GPS de la foto original (que para
  //    un perfil de un menor pueden revelar dónde vive, en qué colegio o
  //    club juega) nunca llegan al archivo que queda public en Storage.
  let buffer: Buffer;
  try {
    buffer = await sharp(rawBuffer, { failOn: "error" })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error(`[photos/upload] no se pudo procesar la imagen de ${ctx.user.id}`, err);
    return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 400 });
  }

  const contentType = "image/jpeg";
  const baseName = sanitizeFileName(file.name).replace(/\.\w+$/, "");
  const path = `${ctx.user.id}/${slot}/${crypto.randomUUID()}-${baseName}.jpg`;

  const supabaseAdmin = getSupabaseAdmin();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  if (slot === "avatar") {
    await prisma.athleteProfile.update({
      where: { id: profile.id },
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
