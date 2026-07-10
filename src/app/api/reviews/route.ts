import { withApi, parseBody, json, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";
import { reviewCard } from "@/lib/srs";
import { awardXp, addSkillXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

/** GET: today's review queue — cards due now, oldest first. */
export const GET = withApi(async () => {
  const user = await requireUser();
  const now = new Date();
  const [queue, dueCount] = await Promise.all([
    db.flashcard.findMany({
      where: { userId: user.id, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      take: 20,
      include: { skill: { select: { id: true, name: true, color: true } } },
    }),
    db.flashcard.count({ where: { userId: user.id, dueAt: { lte: now } } }),
  ]);
  return json({ queue, dueCount });
});

/** POST: grade a card (EASY/MEDIUM/HARD) — SM-2 reschedule + XP. */
export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const { flashcardId, grade } = await parseBody(req, reviewSchema);

  const card = await db.flashcard.findFirst({ where: { id: flashcardId, userId: user.id } });
  if (!card) notFound();

  const next = reviewCard(
    {
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
      lapses: card.lapses,
    },
    grade,
  );

  const [updated] = await db.$transaction([
    db.flashcard.update({
      where: { id: card.id },
      data: {
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        dueAt: next.dueAt,
      },
    }),
    db.review.create({
      data: { userId: user.id, flashcardId: card.id, grade },
    }),
  ]);

  await awardXp(user.id, XP_REWARDS.REVIEW);
  if (card.skillId) await addSkillXp(card.skillId, user.id, XP_REWARDS.REVIEW);

  return json({ flashcard: updated, nextDue: next.dueAt });
});
