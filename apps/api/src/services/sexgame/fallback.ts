import type {
  GamePhase,
  SexGameSession,
} from "./types";

function getCharacterName(
  session: SexGameSession,
): string {
  return (
    session.characterName?.trim() ||
    "your partner"
  );
}

export function getFallbackDescription(
  session: SexGameSession,
): string {
  const name =
    getCharacterName(session);

  switch (session.phase) {
    case "FOREPLAY":
      return (
        `The atmosphere settles into a quiet sense of anticipation. ` +
        `${name} stays close, and the two of you share a ` +
        `lingering moment as everything else seems to fade away.`
      );

    case "BUILD_UP":
      return (
        `The moment grows warmer and more emotionally charged. ` +
        `You remain focused on each other, responding naturally ` +
        `to every glance, gesture, and change in the atmosphere.`
      );

    case "ACT":
      return (
        `The connection between you feels stronger now. ` +
        `The moment unfolds naturally, with both of you fully ` +
        `present and attentive to each other's reactions.`
      );

    case "INTENSE_ACT":
      return (
        `The emotional intensity rises sharply. ` +
        `Attention narrows and the connection between you ` +
        `feels especially powerful.`
      );

    case "CLIMAX":
      return (
        `The moment reaches its emotional peak, bringing ` +
        `the tension of the previous moments to a natural release.`
      );

    case "AFTERCARE":
      return (
        `The intensity gradually gives way to calm. ` +
        `${name} remains close as the two of you settle ` +
        `into a quieter, warmer moment of comfort and connection.`
      );

    default:
      return (
        `The moment continues naturally as you and ` +
        `${name} remain close and focused on each other.`
      );
  }
}

export function getFallbackOpening(
  session: SexGameSession,
): string {
  const name =
    getCharacterName(session);

  return (
    `The room is calm and warmly lit as you turn toward ` +
    `${name}. For a moment, neither of you says much. ` +
    `There is a quiet sense of anticipation in the air, ` +
    `and the evening seems to slow down as you share the moment together.`
  );
}

export function getFallbackForPhase(
  phase: GamePhase,
): string {
  switch (phase) {
    case "FOREPLAY":
      return (
        "The moment begins gently, with attention focused " +
        "on closeness and anticipation."
      );

    case "BUILD_UP":
      return (
        "The atmosphere becomes increasingly charged as " +
        "the connection between the characters deepens."
      );

    case "ACT":
      return (
        "The moment continues naturally, with both characters " +
        "remaining attentive to each other."
      );

    case "INTENSE_ACT":
      return (
        "The emotional intensity reaches a heightened level, " +
        "creating a strong sense of momentum."
      );

    case "CLIMAX":
      return (
        "The built-up tension reaches its emotional peak " +
        "before gradually settling."
      );

    case "AFTERCARE":
      return (
        "The scene settles into warmth, reassurance, " +
        "and quiet companionship."
      );
  }
}
