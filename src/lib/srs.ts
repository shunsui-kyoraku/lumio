/**
 * Spaced repetition — SM-2 variant.
 *
 * Grades map to SM-2 quality scores:
 *   EASY   -> q = 5
 *   MEDIUM -> q = 4
 *   HARD   -> q = 2  (treated as a lapse: repetitions reset, card due tomorrow)
 */

export type Grade = "EASY" | "MEDIUM" | "HARD";

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
}

const MIN_EASE = 1.3;
const GRADE_QUALITY: Record<Grade, number> = { EASY: 5, MEDIUM: 4, HARD: 2 };

export function reviewCard(state: SrsState, grade: Grade, now: Date = new Date()): SrsResult {
  const q = GRADE_QUALITY[grade];

  // Ease factor update (standard SM-2 formula), floored at 1.3
  const ease = Math.max(
    MIN_EASE,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let repetitions: number;
  let intervalDays: number;
  let lapses = state.lapses;

  if (q < 3) {
    // Lapse: restart the learning ladder, see it again tomorrow
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * ease);
  }

  intervalDays = Math.min(intervalDays, 365); // cap runaway intervals

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { easeFactor: ease, intervalDays, repetitions, lapses, dueAt };
}
