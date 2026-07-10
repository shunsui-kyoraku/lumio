import { withApi, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelForXp, levelProgress, titleForLevel, skillTier } from "@/lib/xp";
import { getPlan } from "@/lib/plans";

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const GET = withApi(async () => {
  const user = await requireUser();
  const now = new Date();
  const todayStart = utcDayStart(now);
  const weekStart = new Date(todayStart.getTime() - 6 * 86_400_000);
  const yearStart = new Date(todayStart.getTime() - 364 * 86_400_000);

  const [todaySessions, weekSessions, yearSessions, reviewsDue, skills, achievements, journalToday] =
    await Promise.all([
      db.learningSession.aggregate({
        where: { userId: user.id, date: { gte: todayStart } },
        _sum: { minutes: true },
        _count: true,
      }),
      db.learningSession.findMany({
        where: { userId: user.id, date: { gte: weekStart } },
        select: { minutes: true, skillId: true, date: true },
      }),
      db.learningSession.findMany({
        where: { userId: user.id, date: { gte: yearStart } },
        select: { minutes: true, date: true },
      }),
      db.flashcard.count({ where: { userId: user.id, dueAt: { lte: now } } }),
      db.skill.findMany({
        where: { userId: user.id },
        orderBy: { xp: "desc" },
        select: { id: true, name: true, color: true, progress: true, xp: true, parentId: true },
      }),
      db.userAchievement.findMany({
        where: { userId: user.id },
        orderBy: { unlockedAt: "desc" },
        take: 5,
      }),
      db.journalEntry.findUnique({
        where: { userId_date: { userId: user.id, date: todayStart } },
        select: { id: true },
      }),
    ]);

  // Calendar heatmap: minutes per UTC day for the last 365 days
  const heatmap: Record<string, number> = {};
  for (const s of yearSessions) {
    const key = utcDayStart(s.date).toISOString().slice(0, 10);
    heatmap[key] = (heatmap[key] ?? 0) + s.minutes;
  }

  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.minutes, 0);
  const skillsImproved = new Set(weekSessions.map((s) => s.skillId).filter(Boolean)).size;
  const level = levelForXp(user.xp);

  return json({
    greetingName: user.name?.split(" ")[0] ?? null,
    today: {
      minutes: todaySessions._sum.minutes ?? 0,
      sessions: todaySessions._count,
      goalMinutes: user.dailyGoalMinutes,
      reviewsDue,
      journalDone: Boolean(journalToday),
    },
    week: {
      minutes: weekMinutes,
      targetHours: user.weeklyTargetHours,
      skillsImproved,
      progressPct: Math.min(
        100,
        Math.round((weekMinutes / (user.weeklyTargetHours * 60)) * 100),
      ),
    },
    streak: { current: user.currentStreak, longest: user.longestStreak },
    xp: {
      total: user.xp,
      level,
      title: titleForLevel(level),
      progress: levelProgress(user.xp),
    },
    skills: skills.slice(0, 8).map((s) => ({ ...s, tier: skillTier(s.xp) })),
    heatmap,
    recentAchievements: achievements,
    plan: await getPlan(),
  });
});
