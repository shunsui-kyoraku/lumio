import { describe, it, expect } from "vitest";
import { reviewCard, type SrsState } from "../srs";

const fresh: SrsState = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
const NOW = new Date("2026-07-10T12:00:00Z");

describe("SM-2 spaced repetition", () => {
  it("first successful review is due in 1 day", () => {
    const r = reviewCard(fresh, "MEDIUM", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.dueAt.getTime()).toBe(NOW.getTime() + 86_400_000);
  });

  it("second successful review is due in 6 days", () => {
    const first = reviewCard(fresh, "MEDIUM", NOW);
    const second = reviewCard(first, "MEDIUM", NOW);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(6);
  });

  it("third review multiplies interval by ease factor", () => {
    let s = reviewCard(fresh, "EASY", NOW);
    s = reviewCard(s, "EASY", NOW);
    const third = reviewCard(s, "EASY", NOW);
    expect(third.intervalDays).toBe(Math.round(6 * third.easeFactor));
    expect(third.intervalDays).toBeGreaterThan(6);
  });

  it("EASY raises ease factor, HARD lowers it", () => {
    const easy = reviewCard(fresh, "EASY", NOW);
    const hard = reviewCard(fresh, "HARD", NOW);
    expect(easy.easeFactor).toBeGreaterThan(fresh.easeFactor);
    expect(hard.easeFactor).toBeLessThan(fresh.easeFactor);
  });

  it("HARD is a lapse: repetitions reset, due tomorrow, lapse counted", () => {
    let s = reviewCard(fresh, "EASY", NOW);
    s = reviewCard(s, "EASY", NOW);
    const lapsed = reviewCard(s, "HARD", NOW);
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.intervalDays).toBe(1);
    expect(lapsed.lapses).toBe(1);
  });

  it("ease factor never drops below 1.3", () => {
    let s = fresh;
    for (let i = 0; i < 20; i++) s = reviewCard(s, "HARD", NOW);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("interval is capped at 365 days", () => {
    let s = fresh;
    for (let i = 0; i < 30; i++) s = reviewCard(s, "EASY", NOW);
    expect(s.intervalDays).toBeLessThanOrEqual(365);
  });
});
