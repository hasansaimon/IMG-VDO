import type { GamePhase, SexGameChoice, SexGameSession } from "./sex-game";

export interface StateTransition {
  phase: GamePhase;
  arousal: number;
  stamina: number;
  climaxAchieved: boolean;
  sessionComplete: boolean;
  climaxCount: number;
}

export function getPhaseForArousal(arousal: number): GamePhase {
  if (arousal >= 90) return "CLIMAX";
  if (arousal >= 70) return "INTENSE_ACT";
  if (arousal >= 50) return "ACT";
  if (arousal >= 25) return "BUILD_UP";
  return "FOREPLAY";
}

export function transitionState(
  session: Pick<SexGameSession, "phase" | "arousal" | "stamina" | "climaxCount">,
  choice: Pick<SexGameChoice, "arousalGain" | "staminaCost">,
): StateTransition {
  const arousal = Math.min(100, Math.max(0, session.arousal + choice.arousalGain));
  const stamina = Math.min(100, Math.max(0, session.stamina - choice.staminaCost));
  const nextPhase = getPhaseForArousal(arousal);

  if (nextPhase === "CLIMAX" && session.phase !== "CLIMAX") {
    return {
      phase: "CLIMAX",
      arousal,
      stamina,
      climaxAchieved: true,
      sessionComplete: false,
      climaxCount: session.climaxCount + 1,
    };
  }

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

  return {
    phase: nextPhase,
    arousal,
    stamina,
    climaxAchieved: false,
    sessionComplete: false,
    climaxCount: session.climaxCount,
  };
}