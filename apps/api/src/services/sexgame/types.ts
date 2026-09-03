//
// Shared types for the interactive relationship game.
//

// ─────────────────────────────────────────────────────────────────────────────
// Game phases
// ─────────────────────────────────────────────────────────────────────────────

export type GamePhase =
  | "FOREPLAY"
  | "BUILD_UP"
  | "ACT"
  | "INTENSE_ACT"
  | "CLIMAX"
  | "AFTERCARE";

// ─────────────────────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────────────────────

export type GameLanguage =
  | "ENGLISH"
  | "BANGLA";

// ─────────────────────────────────────────────────────────────────────────────
// Relationship / character configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface GameCharacter {
  name: string;
  relationshipType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Player choice
// ─────────────────────────────────────────────────────────────────────────────

export interface SexGameChoice {
  id: number;
  text: string;

  /**
   * Relative emotional/game intensity of this choice.
   * Range: 1-10.
   */
  intensity: number;

  /**
   * Stamina consumed by the choice.
   * Range: 0-100.
   */
  staminaCost: number;

  /**
   * Arousal/state progression contributed by the choice.
   * Range can be constrained by the game engine.
   */
  arousalGain: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

export interface SexGameHistoryEntry {
  round: number;
  phase: GamePhase;
  choice: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────────────────────────────────────

export interface SexGameSession {
  id: string;
  userId: string;

  /**
   * Optimistic-concurrency version.
   * Incremented every time the authoritative state changes.
   */
  version: number;

  characterName: string;
  relationshipType: string;
  scenario: string;

  language: GameLanguage;
  intensity: number;

  phase: GamePhase;

  /**
   * Authoritative game state.
   * AI narration must never modify these directly.
   */
  arousal: number;
  stamina: number;

  climaxCount: number;
  round: number;

  history: SexGameHistoryEntry[];

  createdAt: Date;
  lastActivity: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene returned to the API/client
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Session creation
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSessionOptions {
  userId: string;

  characterName?: string;
  relationshipType?: string;
  scenario?: string;

  language?: GameLanguage;
  intensity?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Game action
// ─────────────────────────────────────────────────────────────────────────────

export interface GameActionInput {
  sessionId: string;
  userId: string;
  choiceId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API error
// ─────────────────────────────────────────────────────────────────────────────

export interface GameError {
  error: string;
  code?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility types
// ─────────────────────────────────────────────────────────────────────────────

export type GameResult<T> =
  | T
  | GameError;
