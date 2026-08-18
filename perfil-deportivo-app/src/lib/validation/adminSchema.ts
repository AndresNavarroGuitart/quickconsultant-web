import { z } from "zod";

export const adminUserActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("extendTrial"), days: z.number().int().min(1).max(365) }),
  z.object({ action: z.literal("revokeAccess") }),
  z.object({ action: z.literal("setAdmin"), value: z.boolean() }),
]);

export const adminSuggestionUpdateSchema = z.object({
  status: z.enum(["NEW", "PLANNED", "IN_PROGRESS", "DONE", "REJECTED"]),
  adminNote: z.string().trim().max(2000).optional().nullable(),
});

export const composeNotificationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(2000),
  // Si se omite, se envía a todos los usuarios.
  targetEmail: z.string().trim().email().optional().nullable(),
});
