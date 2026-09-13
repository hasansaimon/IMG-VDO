import type {
  GamePhase,
  SexGameChoice,
} from "./types";

const CHOICES: Record<
  GamePhase,
  readonly SexGameChoice[]
> = {
  FOREPLAY: [
    {
      id: 1,
      text: "Stay close and share a gentle affectionate moment",
      intensity: 3,
      staminaCost: 3,
      arousalGain: 5,
    },
    {
      id: 2,
      text: "Deepen the romantic connection",
      intensity: 5,
      staminaCost: 5,
      arousalGain: 8,
    },
    {
      id: 3,
      text: "Build stronger emotional anticipation",
      intensity: 7,
      staminaCost: 6,
      arousalGain: 10,
    },
    {
      id: 4,
      text: "Let the moment become strongly passionate",
      intensity: 9,
      staminaCost: 7,
      arousalGain: 14,
    },
  ],

  BUILD_UP: [
    {
      id: 1,
      text: "Continue with warm and affectionate attention",
      intensity: 4,
      staminaCost: 5,
      arousalGain: 8,
    },
    {
      id: 2,
      text: "Increase the emotional intensity",
      intensity: 6,
      staminaCost: 7,
      arousalGain: 11,
    },
    {
      id: 3,
      text: "Build anticipation and closeness",
      intensity: 8,
      staminaCost: 9,
      arousalGain: 14,
    },
    {
      id: 4,
      text: "Move toward the most intense stage",
      intensity: 10,
      staminaCost: 12,
      arousalGain: 18,
    },
  ],

  ACT: [
    {
      id: 1,
      text: "Continue the intimate moment steadily",
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
      text: "Change the rhythm of the moment",
      intensity: 8,
      staminaCost: 12,
      arousalGain: 15,
    },
    {
      id: 4,
      text: "Push toward a highly intense stage",
      intensity: 10,
      staminaCost: 15,
      arousalGain: 19,
    },
  ],

  INTENSE_ACT: [
    {
      id: 1,
      text: "Maintain the current emotional intensity",
      intensity: 7,
      staminaCost: 12,
      arousalGain: 12,
    },
    {
      id: 2,
      text: "Increase the emotional intensity further",
      intensity: 8,
      staminaCost: 13,
      arousalGain: 15,
    },
    {
      id: 3,
      text: "Build toward the emotional peak",
      intensity: 9,
      staminaCost: 15,
      arousalGain: 18,
    },
    {
      id: 4,
      text: "Commit to the final stage of the encounter",
      intensity: 10,
      staminaCost: 18,
      arousalGain: 22,
    },
  ],

  CLIMAX: [
    {
      id: 1,
      text: "Let the moment reach its natural conclusion",
      intensity: 8,
      staminaCost: 0,
      arousalGain: 0,
    },
    {
      id: 2,
      text: "Stay close through the peak moment",
      intensity: 7,
      staminaCost: 0,
      arousalGain: 0,
    },
    {
      id: 3,
      text: "Pause and share the moment together",
      intensity: 6,
      staminaCost: 0,
      arousalGain: 0,
    },
  ],

  AFTERCARE: [
    {
      id: 1,
      text: "Stay close and offer reassurance",
      intensity: 2,
      staminaCost: 0,
      arousalGain: -5,
    },
    {
      id: 2,
      text: "Help each other relax and recover",
      intensity: 1,
      staminaCost: 0,
      arousalGain: -5,
    },
    {
      id: 3,
      text: "Rest together quietly",
      intensity: 1,
      staminaCost: 0,
      arousalGain: -5,
    },
    {
      id: 4,
      text: "Talk about how you both feel",
      intensity: 3,
      staminaCost: 0,
      arousalGain: -3,
    },
  ],
};

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

export function generateChoicesForPhase(
  phase: GamePhase,
  stamina: number,
  intensity: number,
): SexGameChoice[] {
  const phaseChoices =
    CHOICES[phase] ?? [];

  const safeStamina =
    clamp(stamina, 0, 100);

  const safeIntensity =
    clamp(intensity, 1, 10);

  const available =
    phaseChoices.filter(
      (choice) =>
        choice.intensity <= safeIntensity &&
        choice.staminaCost <= safeStamina,
    );

  if (available.length > 0) {
    return available.map(
      (choice) => ({ ...choice }),
    );
  }

  const intensityCompatible =
    phaseChoices
      .filter(
        (choice) =>
          choice.intensity <= safeIntensity,
      )
      .sort(
        (a, b) =>
          a.staminaCost - b.staminaCost ||
          a.intensity - b.intensity,
      );

  if (intensityCompatible.length > 0) {
    return [
      { ...intensityCompatible[0] },
    ];
  }

  return phaseChoices.length > 0
    ? [{ ...phaseChoices[0] }]
    : [];
}
