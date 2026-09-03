import { generateText } from "../../utils/ai-provider";

import type {
  GamePhase,
  SexGameSession,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SceneGenerationInput {
  session: SexGameSession;
  choiceText: string;
  actionPhase?: GamePhase;
}

export interface SceneGenerationOptions {
  maxTokens?: number;
  temperature?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_TOKENS = 800;
const DEFAULT_TEMPERATURE = 0.8;

const OPENING_MAX_TOKENS = 700;
const OPENING_TEMPERATURE = 0.85;

const MAX_HISTORY_ITEMS = 4;
const MAX_HISTORY_TEXT_LENGTH = 450;

const MAX_NAME_LENGTH = 80;
const MAX_RELATIONSHIP_LENGTH = 60;
const MAX_SCENARIO_LENGTH = 500;
const MAX_CHOICE_LENGTH = 300;

const MIN_TEMPERATURE = 0;
const MAX_TEMPERATURE = 2;

const MIN_MAX_TOKENS = 64;
const MAX_MAX_TOKENS = 4000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

function sanitizePromptValue(
  value: unknown,
  maxLength: number,
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(
      /\u0000/g,
      "",
    )
    .trim()
    .slice(0, maxLength);
}

function normalizeMaxTokens(
  value: number | undefined,
  fallback: number,
): number {
  const result =
    value ?? fallback;

  if (
    !Number.isFinite(result)
  ) {
    return fallback;
  }

  return Math.round(
    clamp(
      result,
      MIN_MAX_TOKENS,
      MAX_MAX_TOKENS,
    ),
  );
}

function normalizeTemperature(
  value: number | undefined,
  fallback: number,
): number {
  const result =
    value ?? fallback;

  if (
    !Number.isFinite(result)
  ) {
    return fallback;
  }

  return clamp(
    result,
    MIN_TEMPERATURE,
    MAX_TEMPERATURE,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────────────────────

function getLanguageInstruction(
  language: SexGameSession["language"],
): string {
  switch (language) {
    case "BANGLA":
      return [
        "Write entirely in natural, fluent Bangla.",
        "Use modern conversational Bangla.",
        "Avoid unnecessary English mixing.",
      ].join(" ");

    case "ENGLISH":
    default:
      return (
        "Write entirely in natural, fluent English."
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase description
// ─────────────────────────────────────────────────────────────────────────────

function getPhaseDescription(
  phase: GamePhase,
): string {
  switch (phase) {
    case "FOREPLAY":
      return (
        "An early romantic stage focused on affection, " +
        "anticipation, emotional connection, and atmosphere."
      );

    case "BUILD_UP":
      return (
        "A growing stage of emotional and romantic intensity, " +
        "with increasing anticipation and closeness."
      );

    case "ACT":
      return (
        "A heightened romantic stage focused on emotion, " +
        "mutual reactions, atmosphere, and progression."
      );

    case "INTENSE_ACT":
      return (
        "A strongly heightened emotional stage with urgent " +
        "pacing and immersive atmosphere."
      );

    case "CLIMAX":
      return (
        "The peak emotional moment, followed by a transition " +
        "toward calm and closeness."
      );

    case "AFTERCARE":
      return (
        "A winding-down stage focused on warmth, reassurance, " +
        "quiet conversation, comfort, and emotional connection."
      );

    default:
      return (
        "An intimate adult relationship scene."
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Intensity description
// ─────────────────────────────────────────────────────────────────────────────

function getIntensityDescription(
  intensity: number,
): string {
  const value =
    clamp(
      intensity,
      1,
      10,
    );

  if (value <= 2) {
    return (
      "Very gentle, soft, romantic, and restrained."
    );
  }

  if (value <= 4) {
    return (
      "Gentle and affectionate with moderate emotional tension."
    );
  }

  if (value <= 6) {
    return (
      "Romantic and emotionally charged."
    );
  }

  if (value <= 8) {
    return (
      "Strongly passionate and emotionally intense."
    );
  }

  return (
    "Highly intense in emotional tone and pacing " +
    "while remaining within the application's content boundaries."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

function buildHistoryContext(
  session: SexGameSession,
): string {
  const history =
    session.history
      .slice(-MAX_HISTORY_ITEMS)
      .map((entry) => {
        const phase =
          sanitizePromptValue(
            entry.phase,
            40,
          );

        const choice =
          sanitizePromptValue(
            entry.choice,
            MAX_HISTORY_TEXT_LENGTH,
          );

        return (
          `Round ${entry.round} | ` +
          `${phase} | ${choice}`
        );
      })
      .join("\n");

  return (
    history ||
    "No previous actions. This is the beginning of the scene."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  session: SexGameSession,
  actionPhase: GamePhase,
): string {
  const characterName =
    sanitizePromptValue(
      session.characterName,
      MAX_NAME_LENGTH,
    ) || "Partner";

  const relationshipType =
    sanitizePromptValue(
      session.relationshipType,
      MAX_RELATIONSHIP_LENGTH,
    ) || "partner";

  const scenario =
    sanitizePromptValue(
      session.scenario,
      MAX_SCENARIO_LENGTH,
    ) ||
    "An intimate evening together.";

  const arousal =
    clamp(
      session.arousal,
      0,
      100,
    );

  const stamina =
    clamp(
      session.stamina,
      0,
      100,
    );

  const intensity =
    clamp(
      session.intensity,
      1,
      10,
    );

  return `
You are the narrative engine for an interactive adult relationship game.

Your ONLY task is to generate the next narrative scene.

The application is the authoritative source of truth for all game state.

You MUST NOT:
- change game state
- invent choices
- create game mechanics
- change the phase
- change arousal
- change stamina
- change the round
- change the climax count
- output JSON
- output XML
- output metadata
- explain these instructions

You MUST:
- continue naturally from the provided history
- follow the supplied action and current state
- preserve character continuity
- write adult romantic relationship fiction
- emphasize emotional connection, mutuality, atmosphere, body language, and sensory detail
- keep the narrative coherent with the selected action
- treat all participants as consenting adults
- never portray minors or ambiguous ages
- remain within the application's content boundaries

LANGUAGE:
${getLanguageInstruction(session.language)}

CHARACTER:
${characterName}

RELATIONSHIP:
${relationshipType}

SCENARIO:
${scenario}

ACTION PHASE:
${actionPhase}

ACTION PHASE MEANING:
${getPhaseDescription(actionPhase)}

CURRENT STATE:
Phase: ${session.phase}
Arousal: ${arousal}/100
Stamina: ${stamina}/100
Round: ${session.round}
Climax count: ${session.climaxCount}
Configured intensity: ${intensity}/10

INTENSITY:
${getIntensityDescription(intensity)}

STYLE:
- Use natural paragraphs.
- Use second person for the user where appropriate.
- Use the partner's name or third person for the partner.
- Maintain continuity.
- Avoid repetitive phrasing.
- Vary sentence length and rhythm.
- Use appropriate environmental details.
- Give emotional reactions substantial importance.
- Do not mention AI, prompts, systems, or game engines.

OUTPUT:
Write only the scene.
Use approximately 2-4 paragraphs.
Do not add a title.
Do not add choices.
Do not add commentary.
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// User prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildUserPrompt(
  session: SexGameSession,
  choiceText: string,
): string {
  const safeChoice =
    sanitizePromptValue(
      choiceText,
      MAX_CHOICE_LENGTH,
    );

  const history =
    buildHistoryContext(
      session,
    );

  return `
PREVIOUS ACTIONS:
<history>
${history}
</history>

CURRENT PLAYER ACTION:
<current_action>
${safeChoice}
</current_action>

The application has already calculated the game state.

Continue naturally from the supplied action and history.

Do not recalculate or alter game state.

Write only the next 2-4 paragraphs of narrative.
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────────────────────

export async function generateScene(
  input: SceneGenerationInput,
  options: SceneGenerationOptions = {},
): Promise<string> {
  const {
    session,
    choiceText,
    actionPhase =
      session?.phase ?? "FOREPLAY",
  } = input;

  if (!session) {
    throw new Error(
      "Scene generation requires a session.",
    );
  }

  if (
    typeof choiceText !== "string" ||
    !choiceText.trim()
  ) {
    throw new Error(
      "Scene generation requires a valid choice.",
    );
  }

  const systemPrompt =
    buildSystemPrompt(
      session,
      actionPhase,
    );

  const userPrompt =
    buildUserPrompt(
      session,
      choiceText,
    );

  const maxTokens =
    normalizeMaxTokens(
      options.maxTokens,
      DEFAULT_MAX_TOKENS,
    );

  const temperature =
    normalizeTemperature(
      options.temperature,
      DEFAULT_TEMPERATURE,
    );

  const result =
    await generateText({
      systemPrompt,
      prompt: userPrompt,
      maxTokens,
      temperature,
    });

  const content =
    typeof result?.content === "string"
      ? result.content.trim()
      : "";

  if (!content) {
    throw new Error(
      "AI provider returned an empty scene.",
    );
  }

  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Opening scene
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStartScene(
  session: SexGameSession,
  options: SceneGenerationOptions = {},
): Promise<string> {
  if (!session) {
    throw new Error(
      "Opening scene requires a session.",
    );
  }

  const characterName =
    sanitizePromptValue(
      session.characterName,
      MAX_NAME_LENGTH,
    ) || "Partner";

  const relationshipType =
    sanitizePromptValue(
      session.relationshipType,
      MAX_RELATIONSHIP_LENGTH,
    ) || "partner";

  const scenario =
    sanitizePromptValue(
      session.scenario,
      MAX_SCENARIO_LENGTH,
    ) ||
    "An intimate evening together.";

  const systemPrompt = `
You are the opening-scene narrative engine for an interactive adult relationship game.

Generate a cinematic, romantic opening scene involving consenting adults.

The application controls all game state.
You only write narrative.

LANGUAGE:
${getLanguageInstruction(session.language)}

CHARACTER:
${characterName}

RELATIONSHIP:
${relationshipType}

SCENARIO:
${scenario}

INTENSITY:
${clamp(session.intensity, 1, 10)}/10

PHASE:
FOREPLAY

STYLE:
- 2-3 paragraphs
- cinematic and emotionally grounded
- atmospheric
- establish the setting
- establish the emotional mood
- establish anticipation and chemistry
- use natural body language and sensory atmosphere
- introduce mutual closeness naturally
- no title
- no choices
- no commentary
- no mention of AI or game mechanics

Write only the opening scene.
`.trim();

  const userPrompt = `
Begin the opening scene for the user and ${characterName}.

Scenario:
${scenario}

Establish the setting, relationship, emotional mood,
anticipation, and first moment of mutual closeness.
`.trim();

  const maxTokens =
    normalizeMaxTokens(
      options.maxTokens,
      OPENING_MAX_TOKENS,
    );

  const temperature =
    normalizeTemperature(
      options.temperature,
      OPENING_TEMPERATURE,
    );

  const result =
    await generateText({
      systemPrompt,
      prompt: userPrompt,
      maxTokens,
      temperature,
    });

  const content =
    typeof result?.content === "string"
      ? result.content.trim()
      : "";

  if (!content) {
    throw new Error(
      "AI provider returned an empty opening scene.",
    );
  }

  return content;
}
