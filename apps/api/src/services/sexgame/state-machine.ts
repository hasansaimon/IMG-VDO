import type {
  GamePhase,
  SexGameChoice,
  SexGameSession,
} from "./sex-game";

export interface TransitionResult {
  session: SexGameSession;
  actionPhase: GamePhase;
  choice: SexGameChoice;
  climaxAchieved: boolean;
  sessionComplete: boolean;
}

export function getPhaseForArousal(
  arousal: number,
): GamePhase {
  if (arousal >= 90) return "CLIMAX";
  if (arousal >= 70) return "INTENSE_ACT";
  if (arousal >= 50) return "ACT";
  if (arousal >= 25) return "BUILD_UP";
  return "FOREPLAY";
}

export function transitionSession(
  source: SexGameSession,
  choice: SexGameChoice,
): TransitionResult {
  const session: SexGameSession = {
    ...source,
    history: [...source.history],
    lastActivity: new Date(),
  };

  const actionPhase = source.phase;

  // Apply action effects.
  session.round += 1;

  session.arousal = Math.max(
    0,
    Math.min(
      100,
      source.arousal + choice.arousalGain,
    ),
  );

  session.stamina = Math.max(
    0,
    Math.min(
      100,
      source.stamina - choice.staminaCost,
    ),
  );

  let climaxAchieved = false;
  let sessionComplete = false;

  const calculatedPhase = getPhaseForArousal(
    session.arousal,
  );

  switch (source.phase) {
    case "CLIMAX": {
      // A climax scene has been completed.
      session.phase = "AFTERCARE";
      break;
    }

    case "AFTERCARE": {
      // Completing an aftercare action ends the session.
      session.phase = "AFTERCARE";
      sessionComplete = true;
      break;
    }

    default: {
      if (
        calculatedPhase === "CLIMAX" &&
        source.phase !== "CLIMAX"
      ) {
        climaxAchieved = true;
        session.climaxCount += 1;
        session.phase = "CLIMAX";
      } else {
        session.phase = calculatedPhase;
      }

      break;
    }
  }

  session.version += 1;

  return {
    session,
    actionPhase,
    choice,
    climaxAchieved,
    sessionComplete,
  };
}
