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

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? null,
    },
  });

  return NextResponse.json({ suggestion });
}
