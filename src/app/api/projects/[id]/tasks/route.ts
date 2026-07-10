import { withApi, parseBody, json, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskCreateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, taskCreateSchema);

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    select: { id: true, _count: { select: { tasks: true } } },
  });
  if (!project) notFound();

  const task = await db.projectTask.create({
    data: { projectId: project.id, title: data.title, position: project._count.tasks },
  });
  return json({ task }, { status: 201 });
});
