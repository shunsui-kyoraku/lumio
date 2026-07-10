import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessionCreateSchema } from "@/lib/validation";
import { awardXp, addSkillXp } from "@/lib/activity";
import { sessionXp } from "@/lib/xp";

export const GET = withApi(async () => {
  const user = await requireUser();
  const sessions = await db.learningSession.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 50,
    include: {
      skill: { select: { id: true, name: true, color: true } },
      resource: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });
  return json({ sessions });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, sessionCreateSchema);

  for (const [key, model] of [
    ["skillId", db.skill],
    ["resourceId", db.resource],
    ["projectId", db.project],
  ] as const) {
    const refId = data[key];
    if (refId) {
      const found = await (model as typeof db.skill).findFirst({
        where: { id: refId, userId: user.id },
        select: { id: true },
      });
      if (!found) throw new ApiError(400, `${key} not found`);
    }
  }

  const session = await db.learningSession.create({
    data: {
      userId: user.id,
      minutes: data.minutes,
      skillId: data.skillId ?? null,
      resourceId: data.resourceId ?? null,
      projectId: data.projectId ?? null,
      note: data.note ?? null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  const xp = sessionXp(data.minutes);
  await awardXp(user.id, xp);
  if (data.skillId) await addSkillXp(data.skillId, user.id, xp);

  return json({ session, xpEarned: xp }, { status: 201 });
});
