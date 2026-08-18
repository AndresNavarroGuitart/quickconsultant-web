import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { createSuggestionSchema } from "@/lib/validation/suggestionSchema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const suggestions = await prisma.suggestion.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ suggestions });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = createSuggestionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      userId: ctx.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  return NextResponse.json({ suggestion }, { status: 201 });
}
