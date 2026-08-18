import { z } from "zod";

const subjectFields = {
  subjectType: z.enum(["SELF", "DEPENDENT"]).default("SELF"),
  guardianName: z.string().trim().min(2).max(120).optional().nullable(),
  guardianRelationship: z.string().trim().max(60).optional().nullable(),
  guardianConsent: z.boolean().optional(),
};

function requireGuardianInfoWhenDependent(
  data: { subjectType: "SELF" | "DEPENDENT"; guardianName?: string | null; guardianConsent?: boolean },
  ctx: z.RefinementCtx
) {
  if (data.subjectType !== "DEPENDENT") return;

  if (!data.guardianName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["guardianName"],
      message: "Indicá el nombre del padre/madre/tutor",
    });
  }
  if (!data.guardianConsent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["guardianConsent"],
      message: "Necesitamos tu confirmación como responsable",
    });
  }
}

export const createProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    sport: z.string().trim().min(2).max(60),
    location: z.string().trim().max(120).optional().nullable(),
    ...subjectFields,
  })
  .superRefine(requireGuardianInfoWhenDependent);

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80).optional(),
    sport: z.string().trim().min(2).max(60).optional(),
    location: z.string().trim().max(120).optional().nullable(),
    bio: z.string().trim().max(2000).optional().nullable(),
    isPublic: z.boolean().optional(),
    birthDate: z.coerce.date().optional().nullable(),
    position: z.string().trim().max(60).optional().nullable(),
    heightCm: z.coerce.number().int().min(50).max(250).optional().nullable(),
    country: z.string().trim().length(2).optional().nullable(),
    jerseyNumber: z.coerce.number().int().min(0).max(999).optional().nullable(),
    subjectType: z.enum(["SELF", "DEPENDENT"]).optional(),
    guardianName: z.string().trim().min(2).max(120).optional().nullable(),
    guardianRelationship: z.string().trim().max(60).optional().nullable(),
    guardianConsent: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.subjectType === undefined) return;
    requireGuardianInfoWhenDependent(
      { subjectType: data.subjectType, guardianName: data.guardianName, guardianConsent: data.guardianConsent },
      ctx
    );
  });
