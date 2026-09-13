import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  createSession,
  getGameSession,
  processGameAction,
  generateStartScene,
  getAvailableChoices,
} from "../services/sexgame/sex-game";
import { generateImage } from "../utils/ai-provider";

const router = Router();

const startGameSchema = z.object({
  characterName: z.string().trim().min(1).max(100).default("Your Partner"),
  characterId: z.string().optional(),
  relationshipType: z.string().trim().max(100).optional(),
  scenario: z.string().trim().max(500).optional(),
  language: z.enum(["ENGLISH", "BANGLA"]).optional().default("ENGLISH"),
  intensity: z.number().int().min(1).max(10).optional().default(7),
  generateImage: z.boolean().optional().default(false),
});

const actSchema = z.object({
  sessionId: z.string().min(1),
  choiceId: z.number().int().min(1).max(100),
  generateImage: z.boolean().optional().default(false),
});

async function generateAndSaveSceneImage(
  description: string,
  userId: string,
  storyId?: string,
): Promise<string | undefined> {
  try {
    const imagePrompt = `A sensual romantic scene: ${description.substring(0, 500)}`;
    const imageResult = await generateImage({
      prompt: imagePrompt,
      numSteps: 25,
      guidanceScale: 7.5,
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        url: imageResult.imageBase64,
        assetType: "IMAGE",
        label: `Sex game scene - ${new Date().toLocaleString()}`,
        description: description.substring(0, 500),
        storyId: storyId || null,
        userId,
      },
    });

    return `/api/media-assets/${asset.id}`;
  } catch (err) {
    console.warn("Sex game image generation failed:", err);
    return undefined;
  }
}

router.post("/start", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = startGameSchema.parse(req.body);

    let characterName = data.characterName;
    let characterImageUrl: string | undefined;
    let scenario = data.scenario;

    if (data.characterId) {
      const character = await prisma.character.findUnique({
        where: { id: data.characterId },
      });
      if (character && character.userId === userId) {
        characterName = character.name;
        characterImageUrl = character.imageUrl || undefined;
        if (!scenario && character.description) {
          scenario = `An intimate encounter with ${character.name}. ${character.description}`;
        }
      }
    }

    const session = await createSession(userId, {
      characterName,
      characterImageUrl,
      relationshipType: data.relationshipType || "partner",
      scenario: scenario || "A passionate evening together",
      language: data.language,
      intensity: data.intensity,
    });

    const scene = await generateStartScene(session);

    if (data.generateImage) {
      const imageUrl = await generateAndSaveSceneImage(scene.description, userId);
      if (imageUrl) {
        scene.imageUrl = imageUrl;
      }
    }

    res.json({
      success: true,
      sessionId: session.id,
      session: {
        characterName: session.characterName,
        characterImageUrl: session.characterImageUrl,
        relationshipType: session.relationshipType,
        scenario: session.scenario,
        language: session.language,
        intensity: session.intensity,
        version: scene.version,
        createdAt: session.createdAt,
      },
      game: scene,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Sex game start error:", error);
    res.status(500).json({ error: "Failed to start sex game" });
  }
});

router.post("/act", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = actSchema.parse(req.body);

    const result = await processGameAction(
      data.sessionId,
      userId,
      data.choiceId,
    );

    if ("error" in result) {
      const status =
        result.error === "Unauthorized"
          ? 403
          : result.error.includes("not found")
            ? 404
            : 400;
      return res.status(status).json({ error: result.error });
    }

    if (data.generateImage) {
      const imageUrl = await generateAndSaveSceneImage(result.description, userId);
      if (imageUrl) {
        result.imageUrl = imageUrl;
      }
    }

    const session = await getGameSession(data.sessionId, userId);

    res.json({
      success: true,
      sessionId: data.sessionId,
      session: session
        ? {
            characterName: session.characterName,
            characterImageUrl: session.characterImageUrl,
            relationshipType: session.relationshipType,
            scenario: session.scenario,
            language: session.language,
            intensity: session.intensity,
            version: result.version,
          }
        : undefined,
      game: result,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Sex game act error:", error);
    res.status(500).json({ error: "Failed to process action" });
  }
});

router.get("/status/:sessionId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId } = req.params;

    const session = await getGameSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({
        error: "Session not found or expired. Please start a new game.",
      });
    }

    const lastEntry = session.history[session.history.length - 1];
    const choices = getAvailableChoices(session);

    res.json({
      success: true,
      sessionId: session.id,
      session: {
        characterName: session.characterName,
        characterImageUrl: session.characterImageUrl,
        relationshipType: session.relationshipType,
        scenario: session.scenario,
        language: session.language,
        intensity: session.intensity,
        createdAt: session.createdAt,
      },
      game: {
        phase: session.phase,
        arousal: session.arousal,
        stamina: session.stamina,
        round: session.round,
        description: lastEntry?.description || "",
        choices,
        climaxAchieved: false,
        climaxCount: session.climaxCount,
        sessionComplete: session.phase === "AFTERCARE",
        version: session.version,
      },
      history: session.history,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Sex game status error:", error);
    res.status(500).json({ error: "Failed to get session status" });
  }
});

export default router;
