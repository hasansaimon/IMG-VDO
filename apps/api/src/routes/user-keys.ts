/**
 * User API Key Management (BYOK — Bring Your Own Key)
 *
 * Allows authenticated users to manage their own API keys for premium
 * providers (OpenAI, Runway, Pika, ElevenLabs, Replicate).
 *
 * Keys are stored in the database and take precedence over server env vars.
 * NOTE: values are still stored as opaque strings — add AES encryption with
 * ENCRYPTION_KEY before production multi-tenant use.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const router = Router();

const SUPPORTED_PROVIDERS = [
  "openai",
  "runway",
  "pika",
  "elevenlabs",
  "replicate",
] as const;

const upsertKeysSchema = z.object({
  keys: z.record(
    z.enum(SUPPORTED_PROVIDERS),
    z.string().min(1).max(2000).nullable(),
  ),
});

// GET /api/user/keys — Get configured status for the current user
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const userKeys = await prisma.userApiKey.findMany({
      where: { userId },
      select: { provider: true },
    });

    const configured = new Set(userKeys.map((k) => k.provider));
    const keys: Record<string, string | null> = {};

    for (const provider of SUPPORTED_PROVIDERS) {
      // Never return the actual API key to the client.
      keys[provider] = configured.has(provider) ? "configured" : null;
    }

    res.json({
      success: true,
      keys,
      serverDefaults: {
        openai: !!process.env.OPENAI_API_KEY,
        runway: !!process.env.RUNWAY_API_KEY,
        pika: !!process.env.PIKA_API_KEY,
        elevenlabs: !!process.env.ELEVENLABS_API_KEY,
        replicate: !!process.env.REPLICATE_API_KEY,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch user API keys");
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

// PUT /api/user/keys — Upsert API keys for the current user
router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = upsertKeysSchema.parse(req.body);

    for (const [provider, key] of Object.entries(data.keys)) {
      if (key === null) {
        await prisma.userApiKey.deleteMany({
          where: { userId, provider },
        });
      } else {
        await prisma.userApiKey.upsert({
          where: {
            userId_provider: { userId, provider },
          },
          update: { key, updatedAt: new Date() },
          create: { userId, provider, key },
        });
      }
    }

    res.json({
      success: true,
      message: "API keys updated successfully",
      note: "User-provided keys take precedence over server environment variables.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten().fieldErrors });
    }
    logger.error({ err: error }, "Failed to update API keys");
    res.status(500).json({ error: "Failed to update API keys" });
  }
});

export default router;
