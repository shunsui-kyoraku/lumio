import { withApi, parseBody, json, notFound, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resourceUpdateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const resource = await db.resource.findFirst({
    where: { id, userId: user.id },
    include: { skill: { select: { id: true, name: true, color: true } } },
  });
  if (!resource) notFound();
  return json({ resource });
});

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, resourceUpdateSchema);

  const existing = await db.resource.findFirst({ where: { id, userId: user.id } });
  if (!existing) notFound();

  if (data.skillId) {
    const skill = await db.skill.findFirst({
      where: { id: data.skillId, userId: user.id },
      select: { id: true },
    });
    if (!skill) throw new ApiError(400, "Skill not found");
  }

  const resource = await db.resource.update({ where: { id: existing.id }, data });

  // Completion XP awarded exactly once — on the transition into a done state.
  const wasDone = existing.status === "COMPLETED" || existing.status === "MASTERED";
  const isDone = resource.status === "COMPLETED" || resource.status === "MASTERED";
  if (!wasDone && isDone) {
    await awardXp(user.id, XP_REWARDS.RESOURCE_COMPLETED);
  } else if (existing.status === "COMPLETED" && resource.status === "MASTERED") {
    await awardXp(user.id, XP_REWARDS.RESOURCE_MASTERED);
  }

  return json({ resource });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const existing = await db.resource.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  await db.resource.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
