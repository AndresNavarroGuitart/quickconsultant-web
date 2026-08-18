import { z } from "zod";

export const createSuggestionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
});
