import { withApi, parseBody, json, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcardUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, flashcardUpdateSchema);
  const existing = await db.flashcard.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  const flashcard = await db.flashcard.update({
    where: { id: existing.id },
    data: { front: data.front, back: data.back },
  });
  return json({ flashcard });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const existing = await db.flashcard.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  await db.flashcard.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
