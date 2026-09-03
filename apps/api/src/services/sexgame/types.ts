export type GamePhase =
  | "FOREPLAY"
  | "BUILD_UP"
  | "ACT"
  | "INTENSE_ACT"
  | "CLIMAX"
  | "AFTERCARE";

export interface SexGameChoice {
  id: number;
  text: string;
  intensity: number;
  staminaCost: number;
  arousalGain: number;
}

export interface SexGameScene {
  phase: GamePhase;
  arousal: number;
  stamina: number;
  round: number;
  description: string;
  choices: SexGameChoice[];
  climaxAchieved: boolean;
  climaxCount: number;
  sessionComplete: boolean;
  imageUrl?: string;
}

export interface SexGameHistoryEntry {
  phase: GamePhase;
  round: number;
  choice: string;
  description: string;
}

export interface SexGameSession {
  id: string;
  userId: string;
  version: number;

  characterName: string;
  characterImageUrl?: string;
  relationshipType: string;
  scenario: string;

  language: "ENGLISH" | "BANGLA";
  intensity: number;

  phase: GamePhase;
  arousal: number;
  stamina: number;
  climaxCount: number;
  round: number;

  history: SexGameHistoryEntry[];

  createdAt: Date;
  lastActivity: Date;
}
