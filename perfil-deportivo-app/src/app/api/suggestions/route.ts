import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { createSuggestionSchema } from "@/lib/validation/suggestionSchema";
import { readJson } from "@/lib/http/readJson";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const suggestions = await prisma.suggestion.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ suggestions });
}

export async function POST(request: Request) {
  const result = await requireSession();
  if ("error" in result) return result.error;
  const { ctx } = result;

  const json = await readJson(request);
  if (json === undefined) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = createSuggestionSchema.safeParse(json);
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
