import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

// Only allow admin (you can harden this later)
const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  // TODO: replace with real admin check
  next();
};

const corpusSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(50),
  summary: z.string().optional(),
  relationshipType: z.string().optional(),
  actType: z.string().optional(),
  intensity: z.number().min(1).max(10).default(9),
  languageStyle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  characters: z.array(z.string()).optional(),
  source: z.string().optional(),
  quality: z.number().min(1).max(10).default(7),
  isApproved: z.boolean().optional().default(false),
});

const phraseSchema = z.object({
  bangla: z.string().min(1),
  meaning: z.string().optional(),
  category: z.enum([
    "dirty_talk",
    "body_part",
    "action",
    "orgasm",
    "degradation",
    "affection",
    "command",
  ]),
  intensity: z.number().min(1).max(10).default(8),
});

// ─── Upload Story / Scene ───────────────────────────────────────────────────
router.post("/corpus", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = corpusSchema.parse(req.body);

    const entry = await prisma.chotiCorpus.create({
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        relationshipType: data.relationshipType,
        actType: data.actType,
        intensity: data.intensity,
        languageStyle: data.languageStyle,
        tags: data.tags || [],
        characters: data.characters || [],
        source: data.source || "manual",
        quality: data.quality,
        isApproved: data.isApproved,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create corpus entry" });
  }
});

// ─── Bulk Upload Phrases ────────────────────────────────────────────────────
router.post("/phrases", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const body = z.array(phraseSchema).parse(req.body);

    const created = await prisma.chotiPhrase.createMany({
      data: body,
      skipDuplicates: true,
    });

    res.status(201).json({ count: created.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create phrases" });
  }
});

// ─── List Corpus ────────────────────────────────────────────────────────────
router.get("/corpus", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { approved, relationshipType, limit = "20" } = req.query;

    const entries = await prisma.chotiCorpus.findMany({
      where: {
        ...(approved === "true" ? { isApproved: true } : {}),
        ...(relationshipType ? { relationshipType: String(relationshipType) } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 20, 100),
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch corpus" });
  }
});

// ─── Approve Entry ──────────────────────────────────────────────────────────
router.patch("/corpus/:id/approve", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.chotiCorpus.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

// ─── Delete ─────────────────────────────────────────────────────────────────
router.delete("/corpus/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.chotiCorpus.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
