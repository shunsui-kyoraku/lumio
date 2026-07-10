import { withApi, parseBody, json, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskUpdateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

/** Loads the task only if its project belongs to the caller. */
async function ownedTask(userId: string, projectId: string, taskId: string) {
  return db.projectTask.findFirst({
    where: { id: taskId, projectId, project: { userId } },
  });
}

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, taskId } = await params;
  const data = await parseBody(req, taskUpdateSchema);

  const existing = await ownedTask(user.id, id, taskId);
  if (!existing) notFound();

  const task = await db.projectTask.update({
    where: { id: existing.id },
    data,
  });

  if (!existing.done && task.done) {
    await awardXp(user.id, XP_REWARDS.PROJECT_TASK_DONE);
  }
  return json({ task });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, taskId } = await params;
  const existing = await ownedTask(user.id, id, taskId);
  if (!existing) notFound();
  await db.projectTask.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
