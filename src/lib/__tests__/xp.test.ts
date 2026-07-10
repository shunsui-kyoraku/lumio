import { describe, it, expect } from "vitest";
import {
  levelForXp,
  xpForLevel,
  levelProgress,
  titleForLevel,
  sessionXp,
  skillTier,
  skillProgress,
} from "../xp";

describe("levels", () => {
  it("starts at level 1 with 0 xp", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-5)).toBe(1);
  });

  it("level boundaries follow the quadratic curve", () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(400)).toBe(3);
    expect(levelForXp(8100)).toBe(10);
  });

  it("caps at level 100", () => {
    expect(levelForXp(10_000_000)).toBe(100);
  });

  it("xpForLevel is the inverse of levelForXp at boundaries", () => {
    for (const level of [1, 2, 5, 10, 50, 100]) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });

  it("levelProgress is within [0, 1]", () => {
    for (const xp of [0, 50, 150, 5000, 1_000_000_000]) {
      const p = levelProgress(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("titles match spec milestones", () => {
    expect(titleForLevel(1)).toBe("Beginner");
    expect(titleForLevel(10)).toBe("Developer");
    expect(titleForLevel(50)).toBe("Master");
  });
});

describe("session xp", () => {
  it("awards 1 xp per minute", () => {
    expect(sessionXp(45)).toBe(45);
  });
  it("caps at 240 per session and floors bad input", () => {
    expect(sessionXp(1000)).toBe(240);
    expect(sessionXp(-10)).toBe(0);
    expect(sessionXp(10.9)).toBe(10);
  });
});

describe("skill tiers", () => {
  it("maps xp to tiers", () => {
    expect(skillTier(0)).toBe("Beginner");
    expect(skillTier(400)).toBe("Intermediate");
    expect(skillTier(1200)).toBe("Advanced");
    expect(skillTier(3000)).toBe("Expert");
  });
  it("progress reaches 100 at 3000 xp and never exceeds it", () => {
    expect(skillProgress(0)).toBe(0);
    expect(skillProgress(1500)).toBe(50);
    expect(skillProgress(3000)).toBe(100);
    expect(skillProgress(99999)).toBe(100);
  });
});
