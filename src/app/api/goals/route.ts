import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { goalCreateSchema } from "@/lib/validation";

export const GET = withApi(async () => {
  const user = await requireUser();
  const goals = await db.goal.findMany({
    where: { userId: user.id },
    orderBy: [{ done: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
  });
  return json({ goals });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, goalCreateSchema);
  const goal = await db.goal.create({
    data: {
      userId: user.id,
      title: data.title,
      description: data.description ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
  return json({ goal }, { status: 201 });
});
