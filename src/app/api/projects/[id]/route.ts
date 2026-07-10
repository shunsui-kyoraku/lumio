import { withApi, parseBody, json, notFound, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectUpdateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, projectUpdateSchema);

  const existing = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) notFound();

  let skillsUpdate = {};
  if (data.skillIds) {
    const owned = await db.skill.findMany({
      where: { id: { in: data.skillIds }, userId: user.id },
      select: { id: true },
    });
    if (owned.length !== data.skillIds.length) throw new ApiError(400, "Skill not found");
    skillsUpdate = { skills: { set: owned } };
  }

  const project = await db.project.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      ...skillsUpdate,
    },
    include: { tasks: true, skills: { select: { id: true, name: true, color: true } } },
  });

  if (existing.status !== "COMPLETED" && project.status === "COMPLETED") {
    await awardXp(user.id, XP_REWARDS.PROJECT_COMPLETED);
  }
  return json({ project });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const existing = await db.project.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  await db.project.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
