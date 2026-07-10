import { db } from "./db";
import { levelForXp } from "./xp";

export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  icon: string;
}

/** All achievement definitions. Unlock rows in the DB reference these codes. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "FIRST_SKILL", name: "Planted a Seed", description: "Create your first skill", icon: "🌱" },
  { code: "FIRST_SESSION", name: "First Steps", description: "Log your first learning session", icon: "👣" },
  { code: "FIRST_NOTE", name: "Scribe", description: "Write your first note", icon: "✍️" },
  { code: "FIRST_REVIEW", name: "Recall Rookie", description: "Complete your first flashcard review", icon: "🧠" },
  { code: "FIRST_PROJECT_DONE", name: "Shipped It", description: "Complete your first project", icon: "🚀" },
  { code: "STREAK_7", name: "One Week Wonder", description: "7 day learning streak", icon: "🔥" },
  { code: "STREAK_30", name: "Unstoppable", description: "30 day learning streak", icon: "⚡" },
  { code: "STREAK_100", name: "Centurion", description: "100 day learning streak", icon: "💎" },
  { code: "HOURS_10", name: "Ten Hours In", description: "10 hours of learning logged", icon: "⏱️" },
  { code: "HOURS_100", name: "Century Club", description: "100 hours of learning logged", icon: "🏆" },
  { code: "REVIEWS_100", name: "Memory Athlete", description: "100 flashcard reviews", icon: "🎯" },
  { code: "NOTES_25", name: "Knowledge Gardener", description: "25 notes written", icon: "📚" },
  { code: "LEVEL_10", name: "Developer", description: "Reach level 10", icon: "⭐" },
  { code: "LEVEL_50", name: "Master", description: "Reach level 50", icon: "🌟" },
  { code: "RESOURCES_10_DONE", name: "Finisher", description: "Complete 10 learning resources", icon: "✅" },
];

/**
 * Evaluate all achievement conditions for a user and unlock any new ones.
 * Idempotent — unique(userId, code) prevents duplicates.
 */
export async function checkAchievements(userId: string): Promise<string[]> {
  const [user, unlocked, sessionAgg, reviewCount, noteCount, skillCount, doneProjects, doneResources] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.userAchievement.findMany({ where: { userId }, select: { code: true } }),
      db.learningSession.aggregate({ where: { userId }, _sum: { minutes: true }, _count: true }),
      db.review.count({ where: { userId } }),
      db.note.count({ where: { userId } }),
      db.skill.count({ where: { userId } }),
      db.project.count({ where: { userId, status: "COMPLETED" } }),
      db.resource.count({ where: { userId, status: { in: ["COMPLETED", "MASTERED"] } } }),
    ]);
  if (!user) return [];

  const have = new Set(unlocked.map((u) => u.code));
  const totalMinutes = sessionAgg._sum.minutes ?? 0;
  const level = levelForXp(user.xp);

  const earned: Record<string, boolean> = {
    FIRST_SKILL: skillCount >= 1,
    FIRST_SESSION: sessionAgg._count >= 1,
    FIRST_NOTE: noteCount >= 1,
    FIRST_REVIEW: reviewCount >= 1,
    FIRST_PROJECT_DONE: doneProjects >= 1,
    STREAK_7: user.currentStreak >= 7 || user.longestStreak >= 7,
    STREAK_30: user.currentStreak >= 30 || user.longestStreak >= 30,
    STREAK_100: user.currentStreak >= 100 || user.longestStreak >= 100,
    HOURS_10: totalMinutes >= 600,
    HOURS_100: totalMinutes >= 6000,
    REVIEWS_100: reviewCount >= 100,
    NOTES_25: noteCount >= 25,
    LEVEL_10: level >= 10,
    LEVEL_50: level >= 50,
    RESOURCES_10_DONE: doneResources >= 10,
  };

  const newCodes = Object.entries(earned)
    .filter(([code, ok]) => ok && !have.has(code))
    .map(([code]) => code);

  if (newCodes.length > 0) {
    await db.userAchievement.createMany({
      data: newCodes.map((code) => ({ userId, code })),
      skipDuplicates: true,
    });
  }
  return newCodes;
}
