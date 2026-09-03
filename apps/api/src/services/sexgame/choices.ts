import type {
  GamePhase,
  SexGameChoice,
} from "./types";

export function generateChoicesForPhase(
  phase: GamePhase,
  stamina: number,
  intensity: number,
): SexGameChoice[] {
  const choices: Record<GamePhase, SexGameChoice[]> = {
    FOREPLAY: [
      {
        id: 1,
        text: "Gentle affectionate contact",
        intensity: 3,
        staminaCost: 3,
        arousalGain: 5,
      },
      {
        id: 2,
        text: "A deeper romantic moment",
        intensity: 5,
        staminaCost: 5,
        arousalGain: 8,
      },
      {
        id: 3,
        text: "A more emotionally charged moment",
        intensity: 7,
        staminaCost: 6,
        arousalGain: 10,
      },
      {
        id: 4,
        text: "A strongly passionate moment",
        intensity: 9,
        staminaCost: 7,
        arousalGain: 14,
      },
    ],

    BUILD_UP: [
      {
        id: 1,
        text: "Continue with affectionate attention",
        intensity: 4,
        staminaCost: 5,
        arousalGain: 8,
      },
      {
        id: 2,
        text: "Increase emotional intensity",
        intensity: 6,
        staminaCost: 7,
        arousalGain: 11,
      },
      {
        id: 3,
        text: "Build anticipation",
        intensity: 8,
        staminaCost: 9,
        arousalGain: 14,
      },
      {
        id: 4,
        text: "Push the scene toward its most intense stage",
        intensity: 10,
        staminaCost: 12,
        arousalGain: 18,
      },
    ],

    ACT: [
      {
        id: 1,
        text: "Continue the intimate encounter steadily",
        intensity: 6,
        staminaCost: 8,
        arousalGain: 10,
      },
      {
        id: 2,
        text: "Increase the pace and emotional intensity",
        intensity: 7,
        staminaCost: 10,
        arousalGain: 13,
      },
      {
        id: 3,
        text: "Change the rhythm of the encounter",
        intensity: 8,
        staminaCost: 12,
        arousalGain: 15,
      },
      {
        id: 4,
        text: "Take the encounter to a highly intense stage",
        intensity: 10,
        staminaCost: 15,
        arousalGain: 19,
      },
    ],

    INTENSE_ACT: [
      {
        id: 1,
        text: "Maintain the current intensity",
        intensity: 7,
        staminaCost: 12,
        arousalGain: 12,
      },
      {
        id: 2,
        text: "Increase the emotional intensity",
        intensity: 8,
        staminaCost: 13,
        arousalGain: 15,
      },
      {
        id: 3,
        text: "Push toward the peak",
        intensity: 9,
        staminaCost: 15,
        arousalGain: 18,
      },
      {
        id: 4,
        text: "Commit fully to the final stage",
        intensity: 10,
        staminaCost: 18,
        arousalGain: 22,
      },
    ],

    CLIMAX: [
      {
        id: 1,
        text: "Let the moment reach its natural conclusion",
        intensity: 10,
        staminaCost: 15,
        arousalGain: 0,
      },
      {
        id: 2,
        text: "Stay close through the peak moment",
        intensity: 10,
        staminaCost: 12,
        arousalGain: 0,
      },
      {
        id: 3,
        text: "Pause and share the moment together",
        intensity: 9,
        staminaCost: 10,
        arousalGain: 0,
      },
    ],

    AFTERCARE: [
      {
        id: 1,
        text: "Stay close and offer reassurance",
        intensity: 2,
        staminaCost: 1,
        arousalGain: -5,
      },
      {
        id: 2,
        text: "Help them relax and recover",
        intensity: 1,
        staminaCost: 2,
        arousalGain: -5,
      },
      {
        id: 3,
        text: "Rest together quietly",
        intensity: 1,
        staminaCost: 1,
        arousalGain: -5,
      },
      {
        id: 4,
        text: "Talk about how you both feel",
        intensity: 3,
        staminaCost: 2,
        arousalGain: -3,
      },
    ],
  };

  return choices[phase].filter(
    (choice) =>
      choice.intensity <= intensity &&
      choice.staminaCost <= stamina,
  );
}
