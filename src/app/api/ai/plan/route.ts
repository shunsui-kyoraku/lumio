import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { consumeAiQuota, requirePremium } from "@/lib/plans";
import { aiPlanSchema } from "@/lib/validation";
import { createLearningPlan } from "@/lib/ai";

/** AI learning plans are a Premium feature (server-enforced). */
export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  await requirePremium();
  const data = await parseBody(req, aiPlanSchema);
  await consumeAiQuota(user.id);
  const plan = await createLearningPlan(
    data.topic,
    data.weeks,
    data.hoursPerWeek ?? 5,
    data.level ?? "BEGINNER",
  );
  return json(plan);
});
