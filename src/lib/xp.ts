/**
 * Gamification math: XP rewards, levels, and titles.
 * Pure functions — unit-tested in src/lib/__tests__/xp.test.ts.
 */

export const XP_REWARDS = {
  SESSION_PER_MINUTE: 1, // capped per session below
  REVIEW: 5,
  NOTE_CREATED: 10,
  JOURNAL_ENTRY: 15,
  RESOURCE_COMPLETED: 50,
  RESOURCE_MASTERED: 25, // on top of completed
  PROJECT_TASK_DONE: 10,
  PROJECT_COMPLETED: 100,
  SKILL_CREATED: 5,
  FLASHCARD_CREATED: 2,
  GOAL_COMPLETED: 30,
} as const;

/** XP for a logged session: 1 XP/minute, capped at 240 per session. */
export function sessionXp(minutes: number): number {
  return Math.min(Math.max(0, Math.floor(minutes)), 240) * XP_REWARDS.SESSION_PER_MINUTE;
}

/** Quadratic level curve: level n starts at (n-1)^2 * 100 XP. Max level 100. */
export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  return Math.min(100, Math.floor(Math.sqrt(xp / 100)) + 1);
}

export function xpForLevel(level: number): number {
  const capped = Math.min(Math.max(1, level), 100);
  return (capped - 1) ** 2 * 100;
}

/** Progress (0-1) through the current level. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  if (level >= 100) return 1;
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return Math.min(1, Math.max(0, (xp - start) / (next - start)));
}

const TITLES: Array<[number, string]> = [
  [100, "Legend"],
  [75, "Grandmaster"],
  [50, "Master"],
  [30, "Specialist"],
  [20, "Practitioner"],
  [10, "Developer"],
  [5, "Learner"],
  [1, "Beginner"],
];

export function titleForLevel(level: number): string {
  for (const [min, title] of TITLES) {
    if (level >= min) return title;
  }
  return "Beginner";
}

/** Skill mastery tier derived from a skill's accumulated XP. */
export function skillTier(skillXp: number): "Beginner" | "Intermediate" | "Advanced" | "Expert" {
  if (skillXp >= 3000) return "Expert";
  if (skillXp >= 1200) return "Advanced";
  if (skillXp >= 400) return "Intermediate";
  return "Beginner";
}

/** Skill progress %: 3000 XP in a skill = 100%. */
export function skillProgress(skillXp: number): number {
  return Math.min(100, Math.floor((skillXp / 3000) * 100));
}
