import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const createCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(), // Can include detailed sexual description
  imageUrl: z.string().url(),
  personality: z.record(z.any()).optional(),
  appearance: z.record(z.any()).optional(), // Detailed body, tits, ass, pussy, cock, etc.
  background: z.string().max(3000).optional(),
  traits: z.array(z.string()).optional(),
  // Explicit adult fields
  sexualRole: z.enum(["dominant", "submissive", "switch", "prey", "predator", "slut", "other"]).optional(),
  kinks: z.array(z.string()).optional(), // e.g. ["creampie", "deepthroat", "anal", "breeding"]
  bodyDetails: z.string().max(1500).optional(), // Explicit physical description
  voiceStyle: z.string().max(500).optional(), // How they talk during sex
  limits: z.array(z.string()).optional(),
  preferredActs: z.array(z.string()).optional(),
});

// GET /api/characters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const characters = await prisma.character.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

// POST /api/characters
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = createCharacterSchema.parse(req.body);

    const character = await prisma.character.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        personality: data.personality ? JSON.stringify(data.personality) : null,
        appearance: data.appearance ? JSON.stringify(data.appearance) : null,
        traits: data.traits ? JSON.stringify(data.traits) : null,
        background: data.background,
        // Store extra adult fields inside personality/appearance or as JSON if your schema supports it
        // If your Prisma schema has extra columns, map them here
        userId,
      },
    });

    res.status(201).json(character);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create character" });
  }
});

// GET /api/characters/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: "Character not found" });
    }

    res.json(character);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

// PUT /api/characters/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const data = createCharacterSchema.partial().parse(req.body);

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: "Character not found" });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        ...data,
        personality: data.personality ? JSON.stringify(data.personality) : undefined,
        appearance: data.appearance ? JSON.stringify(data.appearance) : undefined,
        traits: data.traits ? JSON.stringify(data.traits) : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update character" });
  }
});

// DELETE /api/characters/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: "Character not found" });
    }

    await prisma.character.delete({
      where: { id },
    });

    res.json({ message: "Character deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete character" });
  }
});

export default router;
