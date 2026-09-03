import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const profileSchema = z.object({
  identityPrompt: z.string().trim().min(1).max(10000),
  negativePrompt: z.string().trim().max(10000).optional(),
  style: z.string().trim().max(200).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  referenceAssetIds: z.array(z.string().min(1)).max(20).default([]),
  locked: z.boolean().default(true),
});

async function ownedCharacter(userId: string, characterId: string) {
  return prisma.character.findFirst({
    where: { id: characterId, userId },
    select: { id: true },
  });
}

async function validReferenceAssets(userId: string, assetIds: string[]) {
  if (new Set(assetIds).size !== assetIds.length) return false;
  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: assetIds }, userId, assetType: "IMAGE" },
    select: { id: true },
  });
  return assets.length === assetIds.length;
}

router.get("/:characterId/visual-profile", async (req: AuthRequest, res: Response) => {
  if (!(await ownedCharacter(req.userId!, req.params.characterId))) {
    return res.status(404).json({ error: "Character not found" });
  }
  const profile = await prisma.characterVisualProfile.findUnique({
    where: { characterId: req.params.characterId },
  });
  return res.json(profile);
});

router.put("/:characterId/visual-profile", async (req: AuthRequest, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const userId = req.userId!;
  const characterId = req.params.characterId;
  if (!(await ownedCharacter(userId, characterId))) {
    return res.status(404).json({ error: "Character not found" });
  }
  if (!(await validReferenceAssets(userId, parsed.data.referenceAssetIds))) {
    return res.status(400).json({ error: "Reference assets must be owned image assets" });
  }

  const profile = await prisma.characterVisualProfile.upsert({
    where: { characterId },
    create: { ...parsed.data, characterId },
    update: parsed.data,
  });
  return res.json(profile);
});

router.delete("/:characterId/visual-profile", async (req: AuthRequest, res: Response) => {
  if (!(await ownedCharacter(req.userId!, req.params.characterId))) {
    return res.status(404).json({ error: "Character not found" });
  }
  await prisma.characterVisualProfile.deleteMany({
    where: { characterId: req.params.characterId },
  });
  return res.status(204).send();
});

export default router;