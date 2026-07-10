import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan, PLAN_LIMITS } from "@/lib/plans";
import { profileUpdateSchema } from "@/lib/validation";
import { levelForXp, levelProgress, titleForLevel } from "@/lib/xp";

export const GET = withApi(async () => {
  const user = await requireUser();
  const plan = await getPlan();
  const level = levelForXp(user.xp);
  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    learningGoals: user.learningGoals,
    currentSkills: user.currentSkills,
    learningStyle: user.learningStyle,
    dailyGoalMinutes: user.dailyGoalMinutes,
    weeklyTargetHours: user.weeklyTargetHours,
    timezone: user.timezone,
    xp: user.xp,
    level,
    levelTitle: titleForLevel(level),
    levelProgress: levelProgress(user.xp),
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    plan,
    limits: PLAN_LIMITS[plan],
  });
});

export const PATCH = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, profileUpdateSchema);
  const updated = await db.user.update({ where: { id: user.id }, data });
  return json({
    learningGoals: updated.learningGoals,
    currentSkills: updated.currentSkills,
    learningStyle: updated.learningStyle,
    dailyGoalMinutes: updated.dailyGoalMinutes,
    weeklyTargetHours: updated.weeklyTargetHours,
    timezone: updated.timezone,
  });
});
