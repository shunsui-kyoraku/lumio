import { db } from "./db";
import { checkAchievements } from "./achievements";

function utcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetweenUtc(a: Date, b: Date): number {
  return Math.round((utcDateOnly(b).getTime() - utcDateOnly(a).getTime()) / 86_400_000);
}

/**
 * Record learning activity for a user: add XP and maintain the daily streak.
 * Called from session logging, reviews, journal entries etc.
 */
export async function awardXp(userId: string, amount: number): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
  });
  if (!user) return;

  const now = new Date();
  let { currentStreak, longestStreak } = user;

  if (!user.lastActivityDate) {
    currentStreak = 1;
  } else {
    const gap = daysBetweenUtc(user.lastActivityDate, now);
    if (gap === 1) currentStreak += 1;
    else if (gap > 1) currentStreak = 1;
    // gap === 0 -> already active today, streak unchanged
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: Math.max(0, amount) },
      currentStreak,
      longestStreak,
      lastActivityDate: now,
    },
  });

  // Fire-and-forget is intentional: achievements must never fail the request.
  try {
    await checkAchievements(userId);
  } catch (err) {
    console.error("[achievements] check failed:", err);
  }
}

/** Add XP to a skill and refresh its derived progress %. */
export async function addSkillXp(skillId: string, userId: string, amount: number): Promise<void> {
  const skill = await db.skill.findFirst({ where: { id: skillId, userId } });
  if (!skill) return;
  const { skillProgress } = await import("./xp");
  const newXp = skill.xp + Math.max(0, amount);
  await db.skill.update({
    where: { id: skill.id },
    data: { xp: newXp, progress: skillProgress(newXp) },
  });
}
