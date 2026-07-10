import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertWithinLimit } from "@/lib/plans";
import { resourceCreateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const skillId = url.searchParams.get("skillId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const type = url.searchParams.get("type") ?? undefined;

  const resources = await db.resource.findMany({
    where: {
      userId: user.id,
      ...(skillId ? { skillId } : {}),
      ...(status && ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "MASTERED"].includes(status)
        ? { status: status as "NOT_STARTED" }
        : {}),
      ...(type ? { type: type as "BOOK" } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { skill: { select: { id: true, name: true, color: true } } },
  });
  return json({ resources });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  await assertWithinLimit("resources", user.id);
  const data = await parseBody(req, resourceCreateSchema);

  if (data.skillId) {
    const skill = await db.skill.findFirst({
      where: { id: data.skillId, userId: user.id },
      select: { id: true },
    });
    if (!skill) throw new ApiError(400, "Skill not found");
  }

  const resource = await db.resource.create({
    data: {
      userId: user.id,
      title: data.title,
      type: data.type ?? "OTHER",
      url: data.url ?? null,
      author: data.author ?? null,
      category: data.category ?? null,
      skillId: data.skillId ?? null,
      difficulty: data.difficulty ?? "BEGINNER",
      status: data.status ?? "NOT_STARTED",
      difficultyRating: data.difficultyRating ?? null,
      qualityRating: data.qualityRating ?? null,
      notes: data.notes ?? null,
    },
  });

  if (resource.status === "COMPLETED" || resource.status === "MASTERED") {
    await awardXp(user.id, XP_REWARDS.RESOURCE_COMPLETED);
  }
  return json({ resource }, { status: 201 });
});
