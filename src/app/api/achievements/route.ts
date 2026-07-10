import { withApi, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";

export const GET = withApi(async () => {
  const user = await requireUser();
  const unlocked = await db.userAchievement.findMany({ where: { userId: user.id } });
  const byCode = new Map(unlocked.map((u) => [u.code, u.unlockedAt]));
  return json({
    achievements: ACHIEVEMENTS.map((a) => ({
      ...a,
      unlockedAt: byCode.get(a.code) ?? null,
    })),
  });
});
