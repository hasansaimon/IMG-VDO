import type { SexGameSession } from "./sex-game";

// ─────────────────────────────────────────────────────────────────────────────
// Limits
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CHARACTER_NAME = 80;
const MAX_RELATIONSHIP_TYPE = 60;
const MAX_SCENARIO = 500;

// ─────────────────────────────────────────────────────────────────────────────
// Basic sanitization
// ─────────────────────────────────────────────────────────────────────────────

export function sanitizeText(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

// ─────────────────────────────────────────────────────────────────────────────
// Choice validation
// ─────────────────────────────────────────────────────────────────────────────

export function validateChoiceId(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 100
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session creation validation
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionCreateOptions {
  characterName?: string;
  relationshipType?: string;
  scenario?: string;
  language?: "ENGLISH" | "BANGLA";
  intensity?: number;
}

export interface ValidatedSessionCreateOptions {
  characterName: string;
  relationshipType: string;
  scenario: string;
  language: "ENGLISH" | "BANGLA";
  intensity: number;
}

export function validateSessionCreateOptions(
  options: SessionCreateOptions = {},
): ValidatedSessionCreateOptions {
  const intensity = options.intensity ?? 7;

  if (
    !Number.isInteger(intensity) ||
    intensity < 1 ||
    intensity > 10
  ) {
    throw new Error(
      "Intensity must be an integer between 1 and 10.",
    );
  }

  if (
    options.language !== undefined &&
    options.language !== "ENGLISH" &&
    options.language !== "BANGLA"
  ) {
    throw new Error(
      "Unsupported language. Use ENGLISH or BANGLA.",
    );
  }

  return {
    characterName: sanitizeText(
      options.characterName,
      MAX_CHARACTER_NAME,
    ),

    relationshipType: sanitizeText(
      options.relationshipType,
      MAX_RELATIONSHIP_TYPE,
    ),

    scenario: sanitizeText(
      options.scenario,
      MAX_SCENARIO,
    ),

    language: options.language ?? "ENGLISH",

    intensity,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session ownership
// ─────────────────────────────────────────────────────────────────────────────

export function isSessionOwnedBy(
  session: SexGameSession,
  userId: string,
): boolean {
  return (
    typeof userId === "string" &&
    userId.length > 0 &&
    session.userId === userId
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session ID validation
// ─────────────────────────────────────────────────────────────────────────────

export function validateSessionId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 100
  );
}
