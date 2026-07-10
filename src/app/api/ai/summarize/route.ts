import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consumeAiQuota } from "@/lib/plans";
import { aiSummarizeSchema } from "@/lib/validation";
import { summarizeMaterial } from "@/lib/ai";

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, aiSummarizeSchema);

  if (data.skillId) {
    const skill = await db.skill.findFirst({
      where: { id: data.skillId, userId: user.id },
      select: { id: true },
    });
    if (!skill) throw new ApiError(400, "Skill not found");
  }

  await consumeAiQuota(user.id);
  const result = await summarizeMaterial(data.text);

  let savedFlashcards = 0;
  if (data.saveFlashcards && result.flashcards.length > 0) {
    const created = await db.flashcard.createMany({
      data: result.flashcards.slice(0, 20).map((f) => ({
        userId: user.id,
        skillId: data.skillId ?? null,
        front: String(f.front).slice(0, 2000),
        back: String(f.back).slice(0, 2000),
      })),
    });
    savedFlashcards = created.count;
  }

  return json({ ...result, savedFlashcards });
});
