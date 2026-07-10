import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertWithinLimit } from "@/lib/plans";
import { skillCreateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS, skillTier } from "@/lib/xp";

export const GET = withApi(async () => {
  const user = await requireUser();
  const skills = await db.skill.findMany({
    where: { userId: user.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { resources: true, notes: true, flashcards: true } } },
  });
  return json({
    skills: skills.map((s) => ({
      id: s.id,
      parentId: s.parentId,
      name: s.name,
      description: s.description,
      category: s.category,
      difficulty: s.difficulty,
      progress: s.progress,
      xp: s.xp,
      tier: skillTier(s.xp),
      color: s.color,
      counts: s._count,
    })),
  });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  await assertWithinLimit("skills", user.id);
  const data = await parseBody(req, skillCreateSchema);

  // Ownership check on the parent — never attach to another user's skill.
  if (data.parentId) {
    const parent = await db.skill.findFirst({
      where: { id: data.parentId, userId: user.id },
      select: { id: true },
    });
    if (!parent) throw new ApiError(400, "Parent skill not found");
  }

  const skill = await db.skill.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description ?? null,
      category: data.category ?? null,
      difficulty: data.difficulty ?? "BEGINNER",
      parentId: data.parentId ?? null,
      color: data.color ?? "#8b5cf6",
    },
  });
  await awardXp(user.id, XP_REWARDS.SKILL_CREATED);
  return json({ skill }, { status: 201 });
});
