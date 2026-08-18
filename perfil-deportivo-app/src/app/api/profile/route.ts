import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { generateUniqueSlug } from "@/lib/athlete/slug";
import {
  createProfileSchema,
  updateProfileSchema,
} from "@/lib/validation/profileSchema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
    include: { photos: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ profile, access: ctx.access });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const existing = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un perfil para este usuario" },
      { status: 409 }
    );
  }

  const parsed = createProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = await generateUniqueSlug(parsed.data.displayName);
  const isDependent = parsed.data.subjectType === "DEPENDENT";

  const profile = await prisma.athleteProfile.create({
    data: {
      userId: ctx.user.id,
      slug,
      displayName: parsed.data.displayName,
      sport: parsed.data.sport,
      location: parsed.data.location ?? null,
      subjectType: parsed.data.subjectType,
      guardianName: isDependent ? parsed.data.guardianName : null,
      guardianRelationship: isDependent ? (parsed.data.guardianRelationship ?? null) : null,
      guardianConsentAt: isDependent ? new Date() : null,
      // La bio requiere acceso activo (trial o suscripción); en el alta
      // inicial casi siempre hay trial fresco, pero igual respetamos la
      // misma regla que en el PATCH en vez de duplicarla.
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const parsed = updateProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bio, guardianConsent, subjectType, guardianName, guardianRelationship, ...alwaysAllowed } =
    parsed.data;

  if (bio !== undefined && !ctx.access.hasAccess) {
    return NextResponse.json(
      { error: "La bio requiere una suscripción activa o trial vigente" },
      { status: 403 }
    );
  }

  const isDependent = subjectType === "DEPENDENT";

  const updated = await prisma.athleteProfile.update({
    where: { userId: ctx.user.id },
    data: {
      ...alwaysAllowed,
      ...(bio !== undefined ? { bio } : {}),
      ...(subjectType !== undefined
        ? {
            subjectType,
            guardianName: isDependent ? guardianName : null,
            guardianRelationship: isDependent ? (guardianRelationship ?? null) : null,
            guardianConsentAt: isDependent ? new Date() : null,
          }
        : {}),
    },
  });

  return NextResponse.json({ profile: updated });
}
