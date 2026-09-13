import { describe, expect, it } from "vitest";

import { levelFromXp, xpThresholdForLevel } from "@/lib/games/level";

describe("levelFromXp", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(xpThresholdForLevel(1)).toBe(0);
  });

  it("reaches level 2 at 100 XP", () => {
    expect(xpThresholdForLevel(2)).toBe(100);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
  });

  it("reaches level 3 at 250 XP", () => {
    expect(xpThresholdForLevel(3)).toBe(250);
    expect(levelFromXp(249)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
  });
});
