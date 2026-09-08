import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACTIVE_PROFILE_COOKIE,
  ACTIVE_PROFILE_COOKIE_OPTIONS,
  getSessionContext,
} from "@/lib/auth/getSessionContext";
import { generateUniqueSlug } from "@/lib/athlete/slug";
import { MAX_PROFILES_PER_USER } from "@/lib/athlete/profileLimit";
import {
  createProfileSchema,
  updateProfileSchema,
} from "@/lib/validation/profileSchema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = ctx.activeProfile
    ? await prisma.athleteProfile.findUnique({
        where: { id: ctx.activeProfile.id },
        include: { photos: { orderBy: { createdAt: "desc" } } },
      })
    : null;

  return NextResponse.json({ profile, access: ctx.access });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (ctx.profiles.length >= MAX_PROFILES_PER_USER) {
    return NextResponse.json(
      { error: `Ya tenés el máximo de ${MAX_PROFILES_PER_USER} perfiles por cuenta` },
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
    },
  });

  // El perfil recién creado pasa a ser el activo de la sesión (si es el
  // primero, no había otro para comparar; si es el segundo, es el que el
  // usuario recién pidió agregar).
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profile.id, ACTIVE_PROFILE_COOKIE_OPTIONS);

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (!ctx.activeProfile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const parsed = updateProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { guardianConsent, subjectType, guardianName, guardianRelationship, ...alwaysAllowed } =
    parsed.data;

  const isDependent = subjectType === "DEPENDENT";

  const updated = await prisma.athleteProfile.update({
    where: { id: ctx.activeProfile.id },
    data: {
      ...alwaysAllowed,
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
