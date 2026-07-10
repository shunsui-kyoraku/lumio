import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcardCreateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const skillId = url.searchParams.get("skillId") ?? undefined;

  const [flashcards, dueCount] = await Promise.all([
    db.flashcard.findMany({
      where: { userId: user.id, ...(skillId ? { skillId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { skill: { select: { id: true, name: true, color: true } } },
    }),
    db.flashcard.count({ where: { userId: user.id, dueAt: { lte: new Date() } } }),
  ]);
  return json({ flashcards, dueCount });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, flashcardCreateSchema);

  // Every foreign key must belong to the caller.
  for (const [key, model] of [
    ["skillId", db.skill],
    ["resourceId", db.resource],
    ["noteId", db.note],
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

  const flashcard = await db.flashcard.create({
    data: {
      userId: user.id,
      front: data.front,
      back: data.back,
      skillId: data.skillId ?? null,
      resourceId: data.resourceId ?? null,
      noteId: data.noteId ?? null,
    },
  });
  await awardXp(user.id, XP_REWARDS.FLASHCARD_CREATED);
  return json({ flashcard }, { status: 201 });
});
