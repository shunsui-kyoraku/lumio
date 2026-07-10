import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectCreateSchema } from "@/lib/validation";

export const GET = withApi(async () => {
  const user = await requireUser();
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
      skills: { select: { id: true, name: true, color: true } },
      sessions: { select: { minutes: true } },
    },
  });
  return json({
    projects: projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.done).length;
      return {
        ...p,
        sessions: undefined,
        progress: total === 0 ? 0 : Math.round((done / total) * 100),
        minutesSpent: p.sessions.reduce((sum, s) => sum + s.minutes, 0),
      };
    }),
  });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, projectCreateSchema);

  let skillConnections: { id: string }[] = [];
  if (data.skillIds && data.skillIds.length > 0) {
    const owned = await db.skill.findMany({
      where: { id: { in: data.skillIds }, userId: user.id },
      select: { id: true },
    });
    if (owned.length !== data.skillIds.length) throw new ApiError(400, "Skill not found");
    skillConnections = owned;
  }

  const project = await db.project.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? "PLANNED",
      skills: { connect: skillConnections },
    },
    include: { tasks: true, skills: { select: { id: true, name: true, color: true } } },
  });
  return json({ project }, { status: 201 });
});
