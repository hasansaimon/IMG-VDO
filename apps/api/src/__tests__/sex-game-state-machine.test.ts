import { describe, expect, test } from "vitest";
import { transitionState } from "../services/sexgame/state-machine";

const choice = { arousalGain: 10, staminaCost: 5 };

describe("sex game state machine", () => {
  test("enters climax when arousal crosses the threshold", () => {
    const result = transitionState(
      { phase: "INTENSE_ACT", arousal: 85, stamina: 60, climaxCount: 0 },
      choice,
    );

    expect(result).toMatchObject({
      phase: "CLIMAX",
      arousal: 95,
      stamina: 55,
      climaxAchieved: true,
      climaxCount: 1,
    });
  });

  test("moves from climax to aftercare on the next action", () => {
    const result = transitionState(
      { phase: "CLIMAX", arousal: 95, stamina: 55, climaxCount: 1 },
      choice,
    );

    expect(result).toMatchObject({
      phase: "AFTERCARE",
      climaxAchieved: false,
      sessionComplete: false,
      climaxCount: 1,
    });
  });

  test("marks aftercare actions complete without changing phase", () => {
    const result = transitionState(
      { phase: "AFTERCARE", arousal: 20, stamina: 50, climaxCount: 1 },
      choice,
    );

    expect(result).toMatchObject({
      phase: "AFTERCARE",
      sessionComplete: true,
      climaxCount: 1,
    });
  });
});