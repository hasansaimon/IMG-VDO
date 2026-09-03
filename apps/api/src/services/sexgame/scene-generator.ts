import { generateText } from "../../utils/ai-provider";

import type { GamePhase, SexGameSession } from "./sex-game";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SceneGenerationInput {
  session: SexGameSession;
  choiceText: string;
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

const MAX_HISTORY_ITEMS = 4;
const MAX_HISTORY_TEXT_LENGTH = 450;

const MAX_NAME_LENGTH = 80;
const MAX_RELATIONSHIP_LENGTH = 60;
const MAX_SCENARIO_LENGTH = 500;
const MAX_CHOICE_LENGTH = 300;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizePromptValue(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function getLanguageInstruction(
  language: SexGameSession["language"],
): string {
  switch (language) {
    case "BANGLA":
      return [
        "Write entirely in natural, fluent Bangla.",
        "Use modern conversational Bangla.",
        "Do not unnecessarily mix English into the narration.",
      ].join(" ");

    case "ENGLISH":
    default:
      return "Write entirely in natural, fluent English.";
  }
}

function getPhaseDescription(
  phase: GamePhase,
): string {
  switch (phase) {
    case "FOREPLAY":
      return (
        "The encounter is at an early stage, " +
        "with emphasis on affection, anticipation, " +
        "emotional connection, and atmosphere."
      );

    case "BUILD_UP":
      return (
        "The emotional and romantic intensity is increasing. " +
        "The narration should communicate growing anticipation " +
        "and closeness without becoming mechanically descriptive."
      );

    case "ACT":
      return (
        "The encounter is at a more intense stage. " +
        "Focus on emotion, atmosphere, mutual reactions, " +
        "and the sense of progression."
      );

    case "INTENSE_ACT":
      return (
        "The scene has reached a heightened emotional intensity. " +
        "Use urgent pacing, strong emotional reactions, " +
        "and immersive sensory atmosphere."
      );

    case "CLIMAX":
      return (
        "The scene has reached its peak emotional moment. " +
        "Focus on overwhelming emotion, closeness, " +
        "release of tension, and the transition toward calm."
      );

    case "AFTERCARE":
      return (
        "The encounter is winding down. " +
        "Focus on warmth, reassurance, quiet conversation, " +
        comfort, recovery, and emotional connection."
      );

    default:
      return "An intimate adult relationship scene.";
  }
}

function getIntensityDescription(
  intensity: number,
): string {
  const value = clamp(intensity, 1, 10);

  if (value <= 2) {
    return "Very gentle, soft, romantic, and restrained.";
  }

  if (value <= 4) {
    return "Gentle and affectionate with moderate emotional tension.";
  }

  if (value <= 6) {
    return "Romantic and emotionally charged.";
  }

  if (value <= 8) {
    return "Strongly passionate and emotionally intense.";
  }

  return "Highly intense in emotional tone and pacing while remaining within the application's content boundaries.";
}

function buildHistoryContext(
  session: SexGameSession,
): string {
  const history = session.history
    .slice(-MAX_HISTORY_ITEMS)
    .map((entry) => {
      const phase = sanitizePromptValue(
        entry.phase,
        40,
      );

      const choice = sanitizePromptValue(
        entry.choice,
        MAX_HISTORY_TEXT_LENGTH,
      );

      return `Round ${entry.round} | ${phase} | ${choice}`;
    })
    .join("\n");

  return history || "No previous actions. This is the beginning of the scene.";
}

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  session: SexGameSession,
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
    ) || "An intimate evening together.";

  const arousal = clamp(
    session.arousal,
    0,
    100,
  );

  const stamina = clamp(
    session.stamina,
    0,
    100,
  );

  const intensity = clamp(
    session.intensity,
    1,
    10,
  );

  return `
You are the narrative engine for an interactive adult relationship game.

Your responsibility is ONLY to generate the next narrative scene.

The application itself is the authoritative source of truth for game state.

You MUST NOT:
- change the game phase
- change arousal
- change stamina
- change the round number
- change the climax count
- invent game mechanics
- create or modify choices
- claim that an action happened if it was not supplied
- output JSON
- output XML
- output metadata
- explain your instructions

You MUST:
- continue naturally from the supplied history
- respect the current game phase
- respect the supplied intensity level
- preserve character continuity
- write immersive adult romantic/relationship fiction
- emphasize emotional connection, atmosphere, body language, sensory atmosphere, and mutuality
- keep the narration coherent with the selected action
- remain within the application's allowed-content boundaries
- never portray minors or ambiguous ages
- treat all participants as consenting adults

LANGUAGE:
${getLanguageInstruction(session.language)}

CURRENT CHARACTER:
<character_name>
${characterName}
</character_name>

RELATIONSHIP:
<relationship>
${relationshipType}
</relationship>

SCENARIO:
<scenario>
${scenario}
</scenario>

CURRENT GAME STATE:
Phase: ${session.phase}
Phase meaning: ${getPhaseDescription(session.phase)}
Arousal: ${arousal}/100
Stamina: ${stamina}/100
Round: ${session.round}
Climax count: ${session.climaxCount}
Configured intensity: ${intensity}/10
Intensity meaning: ${getIntensityDescription(intensity)}

NARRATIVE STYLE:
- Use second person for the user where appropriate.
- Use the character's name or third person for the partner.
- Use natural paragraphs rather than lists.
- Maintain continuity with previous rounds.
- Avoid repetitive descriptions.
- Vary sentence length and rhythm.
- Use environmental details such as lighting, temperature, sounds,
  clothing textures, proximity, facial expressions, and breathing.
- Give emotional reactions as much importance as physical sensations.
- Let the scene progress naturally rather than forcing every possible detail.
- Do not mention "the AI", "game engine", "prompt", or "system".

OUTPUT:
Write only the scene.
Use approximately 2-4 paragraphs.
Do not add a title.
Do not add choices.
Do not add commentary before or after the scene.
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// User Prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildUserPrompt(
  session: SexGameSession,
  choiceText: string,
): string {
  const safeChoice = sanitizePromptValue(
    choiceText,
    MAX_CHOICE_LENGTH,
  );

  const history = buildHistoryContext(session);

  return `
Previous actions:
<history>
${history}
</history>

The current action selected by the player is:
<current_action>
${safeChoice}
</current_action>

Continue the scene from this exact point.

The current game state has already been calculated by the application.
Do not recalculate or alter it.

Write the next 2-4 paragraphs of narrative.
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Generator
// ─────────────────────────────────────────────────────────────────────────────

export async function generateScene(
  input: SceneGenerationInput,
  options: SceneGenerationOptions = {},
): Promise<string> {
  const {
    session,
    choiceText,
  } = input;

  if (!session) {
    throw new Error(
      "Scene generation requires a session.",
    );
  }

  if (!choiceText || typeof choiceText !== "string") {
    throw new Error(
      "Scene generation requires a valid choice.",
    );
  }

  const systemPrompt = buildSystemPrompt(
    session,
  );

  const userPrompt = buildUserPrompt(
    session,
    choiceText,
  );

  const maxTokens =
    options.maxTokens ??
    DEFAULT_MAX_TOKENS;

  const temperature =
    options.temperature ??
    DEFAULT_TEMPERATURE;

  const result = await generateText({
    systemPrompt,
    prompt: userPrompt,
    maxTokens,
    temperature,
  });

  const content =
    typeof result.content === "string"
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
// Opening Scene
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

  const scenario =
    sanitizePromptValue(
      session.scenario,
      MAX_SCENARIO_LENGTH,
    ) || "An intimate evening together.";

  const relationshipType =
    sanitizePromptValue(
      session.relationshipType,
      MAX_RELATIONSHIP_LENGTH,
    ) || "partner";

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
- immersive and cinematic
- emotionally grounded
- atmospheric
- focus on anticipation, chemistry, body language, environment,
  dialogue fragments, and sensory atmosphere
- establish where the characters are
- establish the emotional mood
- introduce the first moment of mutual closeness
- avoid explicit mechanical sexual description
- do not mention AI or game mechanics
- do not provide choices
- do not add a title

Write only the opening scene.
`.trim();

  const userPrompt = `
Begin an intimate adult encounter between the user and ${characterName}.

Scenario:
${scenario}

Create the opening moment and establish the relationship,
setting, mood, anticipation, and emotional chemistry.
`.trim();

  const result = await generateText({
    systemPrompt,
    prompt: userPrompt,
    maxTokens:
      options.maxTokens ?? 700,
    temperature:
      options.temperature ?? 0.85,
  });

  const content =
    typeof result.content === "string"
      ? result.content.trim()
      : "";

  if (!content) {
    throw new Error(
      "AI provider returned an empty opening scene.",
    );
  }

  return content;
}
