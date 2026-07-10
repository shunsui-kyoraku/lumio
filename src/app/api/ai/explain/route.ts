import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { consumeAiQuota } from "@/lib/plans";
import { aiExplainSchema } from "@/lib/validation";
import { explainConcept } from "@/lib/ai";

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const data = await parseBody(req, aiExplainSchema);
  await consumeAiQuota(user.id);
  const explanation = await explainConcept(data.concept, data.level ?? "BEGINNER");
  return json({ explanation });
});
