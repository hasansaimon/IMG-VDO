import crypto from "node:crypto";

import type {
  SexGameScene,
  SexGameSession,
} from "./types";

import {
  sessionCommit,
  sessionGet,
  sessionSet,
} from "./session-store";

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
} from "./validators";

export async function createSession(
  userId: string,
  options: {
    characterName?: string;
    characterImageUrl?: string;
    relationshipType?: string;
    scenario?: string;
    language?: "ENGLISH" | "BANGLA";
    intensity?: number;
  },
): Promise<SexGameSession> {
  if (!userId) {
    throw new Error("userId is required");
  }

  const validated =
    validateSessionCreateOptions(options);

  const now = new Date();

  const session: SexGameSession = {
    id: `sexgame_${Date.now()}_${crypto.randomUUID()}`,
    userId,
    version: 1,

    characterName:
      validated.characterName || "Partner",

    characterImageUrl:
      options.characterImageUrl,

    relationshipType:
      validated.relationshipType || "partner",

    scenario:
      validated.scenario || "An intimate encounter",

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

export async function getGameSession(
  sessionId: string,
  userId: string,
): Promise<SexGameSession | null> {
  const session = await sessionGet(sessionId);

  if (!session) {
    return null;
  }

  if (session.userId !== userId) {
    return null;
  }

  return session;
}

export async function processGameAction(
  sessionId: string,
  userId: string,
  choiceId: number,
): Promise<SexGameScene | { error: string }> {
  if (!validateChoiceId(choiceId)) {
    return {
      error: "Invalid choice ID",
    };
  }

  const session = await sessionGet(sessionId);

  if (!session) {
    return {
      error: "Session not found or expired",
    };
  }

  if (session.userId !== userId) {
    return {
      error: "Unauthorized",
    };
  }

  const choices = generateChoicesForPhase(
    session.phase,
    session.stamina,
    session.intensity,
  );

  const choice = choices.find(
    (item) => item.id === choiceId,
  );

  if (!choice) {
    return {
      error: "Choice is not available",
    };
  }

  const transition = transitionSession(
    session,
    choice,
  );

  let description: string;

  try {
    description = await generateScene({
      session: transition.session,
      choiceText: choice.text,
    });
  } catch (error) {
    console.error(
      "[sexgame] scene generation failed",
      error,
    );

    description =
      "The scene continues naturally as the two of you remain focused on each other.";
  }

  transition.session.history = [
    ...transition.session.history,
    {
      phase: transition.actionPhase,
      round: transition.session.round,
      choice: choice.text,
      description: description.slice(0, 500),
    },
  ].slice(-50);

  const commit = await sessionCommit(
    transition.session,
    session.version,
  );

  if (commit === "conflict") {
    return {
      error:
        "This session was updated by another request. Please retry.",
    };
  }

  const nextChoices =
    transition.sessionComplete
      ? []
      : generateChoicesForPhase(
          transition.session.phase,
          transition.session.stamina,
          transition.session.intensity,
        );

  return {
    phase: transition.session.phase,
    arousal: transition.session.arousal,
    stamina: transition.session.stamina,
    round: transition.session.round,
    description,
    choices: nextChoices,
    climaxAchieved:
      transition.climaxAchieved,
    climaxCount:
      transition.session.climaxCount,
    sessionComplete:
      transition.sessionComplete,
  };
}
