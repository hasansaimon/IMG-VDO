import crypto from "node:crypto";

import type {
  SexGameScene,
  SexGameSession,
} from "./types";

import {
  sessionCommit,
  sessionGet,
  sessionSet,
} from "./session";

import {
  generateChoicesForPhase,
} from "./choices";

import {
  transitionSession,
} from "./state-machine";

import {
  generateScene,
} from "./scene-generator";

import {
  validateChoiceId,
  validateSessionCreateOptions,
  validateSessionId,
  isSessionOwnedBy,
} from "./validators";

// ─────────────────────────────────────────────────────────────────────────────
// Create session
// ─────────────────────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  options: {
    characterName?: string;
    characterImageUrl?: string;
    relationshipType?: string;
    scenario?: string;
    language?: "ENGLISH" | "BANGLA";
    intensity?: number;
  } = {},
): Promise<SexGameSession> {
  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    throw new Error("userId is required");
  }

  const validated =
    validateSessionCreateOptions(options);

  const now = new Date();

  const session: SexGameSession = {
    id: `sexgame_${Date.now()}_${crypto.randomUUID()}`,

    userId: userId.trim(),

    version: 0,

    characterName:
      validated.characterName ||
      "Partner",

    characterImageUrl:
      typeof options.characterImageUrl === "string"
        ? options.characterImageUrl.trim().slice(0, 500)
        : undefined,

    relationshipType:
      validated.relationshipType ||
      "partner",

    scenario:
      validated.scenario ||
      "An intimate encounter",

    language:
      validated.language,

    intensity:
      validated.intensity,

    phase: "FOREPLAY",

    arousal: 5,

    stamina: 100,

    climaxCount: 0,

    round: 0,

    history: [],

    createdAt: now,

    lastActivity: now,
  };

  await sessionSet(session);

  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get session
// ─────────────────────────────────────────────────────────────────────────────

export async function getGameSession(
  sessionId: string,
  userId: string,
): Promise<SexGameSession | null> {
  if (
    !validateSessionId(sessionId)
  ) {
    return null;
  }

  const session =
    await sessionGet(sessionId);

  if (!session) {
    return null;
  }

  if (
    !isSessionOwnedBy(
      session,
      userId,
    )
  ) {
    return null;
  }

  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// Process action
// ─────────────────────────────────────────────────────────────────────────────

export async function processGameAction(
  sessionId: string,
  userId: string,
  choiceId: number,
): Promise<
  SexGameScene | { error: string }
> {
  // Validate input
  if (
    !validateSessionId(sessionId)
  ) {
    return {
      error: "Invalid session ID",
    };
  }

  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return {
      error: "User ID is required",
    };
  }

  if (
    !validateChoiceId(choiceId)
  ) {
    return {
      error: "Invalid choice ID",
    };
  }

  const session =
    await sessionGet(sessionId);

  if (!session) {
    return {
      error: "Session not found or expired",
    };
  }

  if (
    !isSessionOwnedBy(
      session,
      userId,
    )
  ) {
    return {
      error: "Unauthorized",
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Get currently available choices
  // ───────────────────────────────────────────────────────────────────────────

  const choices =
    generateChoicesForPhase(
      session.phase,
      session.stamina,
      session.intensity,
    );

  const choice =
    choices.find(
      (item) => item.id === choiceId,
    );

  if (!choice) {
    return {
      error: "Choice is not available",
    };
  }

  if (
    choice.staminaCost >
    session.stamina
  ) {
    return {
      error: "Not enough stamina",
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Calculate next authoritative state
  // ───────────────────────────────────────────────────────────────────────────

  const transition =
    transitionSession(
      session,
      choice,
    );

  const nextSession =
    transition.session;

  // ───────────────────────────────────────────────────────────────────────────
  // Generate narrative
  // ───────────────────────────────────────────────────────────────────────────

  let description: string;

  try {
    description =
      await generateScene({
        session: nextSession,
        choiceText: choice.text,
      });
  } catch (error) {
    console.error(
      "[sexgame] scene generation failed:",
      error,
    );

    description =
      "The scene continues naturally as the two of you remain focused on each other.";
  }

  if (
    !description.trim()
  ) {
    description =
      "The scene continues naturally as the two of you remain focused on each other.";
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Record history
  // ───────────────────────────────────────────────────────────────────────────

  nextSession.history = [
    ...nextSession.history,
    {
      phase:
        transition.actionPhase,

      round:
        nextSession.round,

      choice:
        choice.text,

      description:
        description
          .trim()
          .slice(0, 500),
    },
  ].slice(-50);

  nextSession.lastActivity =
    new Date();

  // ───────────────────────────────────────────────────────────────────────────
  // Atomic version-aware commit
  // ───────────────────────────────────────────────────────────────────────────

  const commit =
    await sessionCommit(
      nextSession,
      session.version,
    );

  if (
    commit === "conflict"
  ) {
    return {
      error:
        "This session was updated by another request. Please retry.",
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Next choices
  // ───────────────────────────────────────────────────────────────────────────

  const nextChoices =
    transition.sessionComplete
      ? []
      : generateChoicesForPhase(
          nextSession.phase,
          nextSession.stamina,
          nextSession.intensity,
        );

  return {
    phase:
      nextSession.phase,

    arousal:
      nextSession.arousal,

    stamina:
      nextSession.stamina,

    round:
      nextSession.round,

    description,

    choices:
      nextChoices,

    climaxAchieved:
      transition.climaxAchieved,

    climaxCount:
      nextSession.climaxCount,

    sessionComplete:
      transition.sessionComplete,

    version:
      nextSession.version,
  };
}
