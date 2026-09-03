import {
  generateScene,
  generateStartScene as generateOpeningNarrative,
} from "./scene-generator";

import {
  generateChoicesForPhase,
} from "./choices";

import {
  transitionSession,
} from "./state-machine";

import {
  sessionGet,
  sessionSet,
} from "./session-store";

import {
  validateChoiceId,
  validateSessionCreateOptions,
  validateSessionId,
  isSessionOwnedBy,
  sanitizeText,
} from "./validators";

import type {
  SexGameChoice,
  SexGameScene,
  SexGameSession,
  CreateSessionOptions,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Session ID
// ─────────────────────────────────────────────────────────────────────────────

function createSessionId(): string {
  return `sexgame_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create session
// ─────────────────────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  options: Omit<CreateSessionOptions, "userId"> = {},
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
    id: createSessionId(),

    userId: userId.trim(),

    version: 0,

    characterName:
      validated.characterName ||
      "Your Partner",

    relationshipType:
      validated.relationshipType ||
      "partner",

    scenario:
      validated.scenario ||
      "An intimate evening together.",

    language: validated.language,

    intensity: validated.intensity,

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

export async function getSession(
  sessionId: string,
): Promise<SexGameSession | undefined> {
  if (!validateSessionId(sessionId)) {
    return undefined;
  }

  return (
    (await sessionGet(sessionId)) ??
    undefined
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Get available choices
// ─────────────────────────────────────────────────────────────────────────────

export function getAvailableChoices(
  session: SexGameSession,
): SexGameChoice[] {
  return generateChoicesForPhase(
    session.phase,
    session.stamina,
    session.intensity,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Process player action
// ─────────────────────────────────────────────────────────────────────────────

export async function processAction(
  sessionId: string,
  userId: string,
  choiceId: number,
): Promise<
  SexGameScene | { error: string }
> {
  if (!validateSessionId(sessionId)) {
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

  if (!validateChoiceId(choiceId)) {
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
  // Validate selected choice
  // ───────────────────────────────────────────────────────────────────────────

  const choices =
    getAvailableChoices(session);

  const choice = choices.find(
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
  // Calculate authoritative state
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
        choiceText: sanitizeText(
          choice.text,
          300,
        ),
      });
  } catch (error) {
    console.error(
      "[sexgame] scene generation failed:",
      error,
    );

    description =
      getFallbackDescription(
        nextSession,
      );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Record bounded history
  // ───────────────────────────────────────────────────────────────────────────

  nextSession.history = [
    ...nextSession.history,
    {
      phase: transition.actionPhase,
      round: nextSession.round,
      choice: choice.text,
      description:
        description.slice(0, 500),
    },
  ].slice(-50);

  nextSession.lastActivity =
    new Date();

  // ───────────────────────────────────────────────────────────────────────────
  // Persist
  // ───────────────────────────────────────────────────────────────────────────

  await sessionSet(nextSession);

  // ───────────────────────────────────────────────────────────────────────────
  // Generate next choices
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
    phase: nextSession.phase,

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

// ─────────────────────────────────────────────────────────────────────────────
// Fallback narrative
// ─────────────────────────────────────────────────────────────────────────────

export function getFallbackDescription(
  session: SexGameSession,
): string {
  switch (session.phase) {
    case "FOREPLAY":
      return (
        "The atmosphere grows warmer as the two of you " +
        "settle into the moment. A quiet sense of anticipation " +
        "fills the room, making every glance and small gesture " +
        "feel more meaningful."
      );

    case "BUILD_UP":
      return (
        "The emotional tension continues to build. " +
        "You remain close, attentive to each other's reactions, " +
        "while the outside world seems to fade into the background."
      );

    case "ACT":
      return (
        "The moment becomes more emotionally intense. " +
        "You move together naturally, completely focused on " +
        "each other and the atmosphere around you."
      );

    case "INTENSE_ACT":
      return (
        "The moment reaches a heightened intensity. " +
        "Breathing quickens, attention narrows, and the emotional " +
        "connection between you becomes impossible to ignore."
      );

    case "CLIMAX":
      return (
        "The moment reaches its emotional peak. " +
        "After the growing anticipation, everything seems to " +
        "pause for a brief, overwhelming instant before settling."
      );

    case "AFTERCARE":
      return (
        "The intensity gradually gives way to calm. " +
        "The two of you remain close, sharing a quiet sense " +
        "of comfort and connection."
      );

    default:
      return (
        "The two of you remain together in the quiet atmosphere, " +
        "letting the moment unfold naturally."
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Opening scene
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStartScene(
  session: SexGameSession,
): Promise<SexGameScene> {
  let description: string;

  try {
    description =
      await generateOpeningNarrative(
        session,
      );
  } catch (error) {
    console.error(
      "[sexgame] opening scene generation failed:",
      error,
    );

    description =
      "The room is quiet and warmly lit as you and " +
      `${session.characterName || "your partner"} ` +
      "share a lingering moment together. The atmosphere " +
      "feels calm, personal, and full of anticipation.";
  }

  session.history = [
    ...session.history,
    {
      phase: "FOREPLAY",
      round: 0,
      choice: "Session started",
      description:
        description.slice(0, 500),
    },
  ].slice(-50);

  session.lastActivity =
    new Date();

  await sessionSet(session);

  const choices =
    generateChoicesForPhase(
      "FOREPLAY",
      session.stamina,
      session.intensity,
    );

  return {
    phase: "FOREPLAY",

    arousal:
      session.arousal,

    stamina:
      session.stamina,

    round: session.round,

    description,

    choices,

    climaxAchieved: false,

    climaxCount:
      session.climaxCount,

    sessionComplete: false,

    version:
      session.version,
  };
}
