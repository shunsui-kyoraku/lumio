import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalUpsertSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";

function toUtcDate(iso?: string): Date {
  const d = iso ? new Date(`${iso}T00:00:00Z`) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const GET = withApi(async () => {
  const user = await requireUser();
  const entries = await db.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 90,
  });
  return json({ entries });
});

/** Upsert the entry for a given day (defaults to today, UTC). */
export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, journalUpsertSchema);
  const date = toUtcDate(data.date);

  const existing = await db.journalEntry.findUnique({
    where: { userId_date: { userId: user.id, date } },
    select: { id: true },
  });

  const entry = await db.journalEntry.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: {
      learned: data.learned ?? null,
      difficult: data.difficult ?? null,
      questions: data.questions ?? null,
      confidence: data.confidence ?? 3,
    },
    create: {
      userId: user.id,
      date,
      learned: data.learned ?? null,
      difficult: data.difficult ?? null,
      questions: data.questions ?? null,
      confidence: data.confidence ?? 3,
    },
  });

  // XP only for the first entry of a day, not for edits.
  if (!existing) await awardXp(user.id, XP_REWARDS.JOURNAL_ENTRY);

  return json({ entry }, { status: existing ? 200 : 201 });
});
