import { z } from "zod";

export const sessionOptionsSchema = z.object({
  characterName: z.string().trim().min(1).max(100).optional(),
  characterImageUrl: z.string().max(2048).optional(),
  relationshipType: z.string().trim().max(100).optional(),
  scenario: z.string().trim().max(500).optional(),
  language: z.enum(["ENGLISH", "BANGLA"]).optional(),
  intensity: z.number().int().min(1).max(10).optional(),
});

export type SessionOptions = z.infer<typeof sessionOptionsSchema>;