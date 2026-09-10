import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { adminSuggestionUpdateSchema } from "@/lib/validation/adminSchema";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const { id } = await params;
  const parsed = adminSuggestionUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.suggestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Sugerencia no encontrada" }, { status: 404 });
  }

  const newAdminNote = parsed.data.adminNote ?? null;

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNote: newAdminNote,
    },
  });

  // Avisa al usuario solo cuando hay una respuesta nueva (nota no vacía y
  // distinta a la que ya tenía) -- re-guardar tocando solo el estado, o sin
  // cambiar el texto, no genera una notificación repetida.
  if (newAdminNote && newAdminNote !== existing.adminNote) {
    await prisma.notification.create({
      data: {
        userId: suggestion.userId,
        title: `Respuesta a tu sugerencia: "${suggestion.title}"`,
        body: newAdminNote,
      },
    });
  }

  return NextResponse.json({ suggestion });
}
