import type {
  GamePhase,
  SexGameChoice,
  SexGameSession,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Phase order
// ─────────────────────────────────────────────────────────────────────────────

export const PHASE_ORDER: GamePhase[] = [
  "FOREPLAY",
  "BUILD_UP",
  "ACT",
  "INTENSE_ACT",
  "CLIMAX",
  "AFTERCARE",
];

// ─────────────────────────────────────────────────────────────────────────────
// Transition result
// ─────────────────────────────────────────────────────────────────────────────

export interface TransitionResult {
  session: SexGameSession;
  actionPhase: GamePhase;
  choice: SexGameChoice;
  climaxAchieved: boolean;
  sessionComplete: boolean;
}

// Backward-compatible result used by older code.
export interface StateTransition {
  phase: GamePhase;
  arousal: number;
  stamina: number;
  climaxAchieved: boolean;
  sessionComplete: boolean;
  climaxCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase calculation
// ─────────────────────────────────────────────────────────────────────────────

export function getPhaseForArousal(
  arousal: number,
): GamePhase {
  const value = clamp(arousal, 0, 100);

  if (value >= 90) {
    return "CLIMAX";
  }

  if (value >= 70) {
    return "INTENSE_ACT";
  }

  if (value >= 50) {
    return "ACT";
  }

  if (value >= 25) {
    return "BUILD_UP";
  }

  return "FOREPLAY";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main state transition
// ─────────────────────────────────────────────────────────────────────────────

export function transitionSession(
  source: SexGameSession,
  choice: SexGameChoice,
): TransitionResult {
  const actionPhase = source.phase;

  const nextArousal = clamp(
    source.arousal + choice.arousalGain,
    0,
    100,
  );

  const nextStamina = clamp(
    source.stamina - choice.staminaCost,
    0,
    100,
  );

  const nextSession: SexGameSession = {
    ...source,
    arousal: nextArousal,
    stamina: nextStamina,
    round: source.round + 1,
    version: source.version + 1,
    lastActivity: new Date(),
    history: [...source.history],
  };

  let climaxAchieved = false;
  let sessionComplete = false;

  // Once the game reaches its peak, the next action moves into aftercare.
  if (source.phase === "CLIMAX") {
    nextSession.phase = "AFTERCARE";
  }

  // Once already in aftercare, the next action completes the session.
  else if (source.phase === "AFTERCARE") {
    nextSession.phase = "AFTERCARE";
    sessionComplete = true;
  }

  // Normal progression.
  else {
    const calculatedPhase =
      getPhaseForArousal(nextArousal);

    if (calculatedPhase === "CLIMAX") {
      nextSession.phase = "CLIMAX";
      nextSession.climaxCount =
        source.climaxCount + 1;
      climaxAchieved = true;
    } else {
      nextSession.phase = calculatedPhase;
    }
  }

  return {
    session: nextSession,
    actionPhase,
    choice,
    climaxAchieved,
    sessionComplete,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible transition API
// ─────────────────────────────────────────────────────────────────────────────

export function transitionState(
  session: Pick<
    SexGameSession,
    "phase" | "arousal" | "stamina" | "climaxCount"
  >,
  choice: Pick<
    SexGameChoice,
    "arousalGain" | "staminaCost"
  >,
): StateTransition {
  const arousal = clamp(
    session.arousal + choice.arousalGain,
    0,
    100,
  );

  const stamina = clamp(
    session.stamina - choice.staminaCost,
    0,
    100,
  );

  // CLIMAX -> AFTERCARE
  if (session.phase === "CLIMAX") {
    return {
      phase: "AFTERCARE",
      arousal,
      stamina,
      climaxAchieved: false,
      sessionComplete: false,
      climaxCount: session.climaxCount,
    };
  }

  // AFTERCARE -> complete
  if (session.phase === "AFTERCARE") {
    return {
      phase: "AFTERCARE",
      arousal,
      stamina,
      climaxAchieved: false,
      sessionComplete: true,
      climaxCount: session.climaxCount,
    };
  }

  const nextPhase =
    getPhaseForArousal(arousal);

  // Normal phase -> CLIMAX
  if (nextPhase === "CLIMAX") {
    return {
      phase: "CLIMAX",
      arousal,
      stamina,
      climaxAchieved: true,
      sessionComplete: false,
      climaxCount: session.climaxCount + 1,
    };
  }

  return {
    phase: nextPhase,
    arousal,
    stamina,
    climaxAchieved: false,
    sessionComplete: false,
    climaxCount: session.climaxCount,
  };
}
