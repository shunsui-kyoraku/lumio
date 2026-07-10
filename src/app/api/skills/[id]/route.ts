import { withApi, parseBody, json, notFound, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { skillUpdateSchema } from "@/lib/validation";
import { skillTier } from "@/lib/xp";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const skill = await db.skill.findFirst({
    where: { id, userId: user.id },
    include: {
      children: { orderBy: { createdAt: "asc" } },
      resources: { orderBy: { updatedAt: "desc" }, take: 50 },
      notes: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, title: true, tags: true, updatedAt: true },
      },
      _count: { select: { flashcards: true, sessions: true } },
    },
  });
  if (!skill) notFound();
  return json({ skill: { ...skill, tier: skillTier(skill.xp) } });
});

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, skillUpdateSchema);

  const existing = await db.skill.findFirst({ where: { id, userId: user.id } });
  if (!existing) notFound();

  if (data.parentId) {
    if (data.parentId === id) throw new ApiError(400, "A skill cannot be its own parent");
    const parent = await db.skill.findFirst({
      where: { id: data.parentId, userId: user.id },
      select: { id: true },
    });
    if (!parent) throw new ApiError(400, "Parent skill not found");
  }

  const skill = await db.skill.update({ where: { id: existing.id }, data });
  return json({ skill });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const existing = await db.skill.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  await db.skill.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
