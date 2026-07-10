import { withApi, parseBody, json, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { goalUpdateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, goalUpdateSchema);

  const existing = await db.goal.findFirst({ where: { id, userId: user.id } });
  if (!existing) notFound();

  const goal = await db.goal.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      description: data.description,
      targetDate: data.targetDate === undefined ? undefined : data.targetDate ? new Date(data.targetDate) : null,
      done: data.done,
    },
  });

  if (!existing.done && goal.done) {
    await awardXp(user.id, XP_REWARDS.GOAL_COMPLETED);
  }
  return json({ goal });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const existing = await db.goal.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  await db.goal.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
