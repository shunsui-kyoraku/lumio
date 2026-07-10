import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { consumeAiQuota } from "@/lib/plans";
import { aiQuizSchema } from "@/lib/validation";
import { generateQuiz } from "@/lib/ai";

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, aiQuizSchema);
  await consumeAiQuota(user.id);
  const quiz = await generateQuiz(data.topic, data.count ?? 5, data.difficulty ?? "BEGINNER");
  return json(quiz);
});
