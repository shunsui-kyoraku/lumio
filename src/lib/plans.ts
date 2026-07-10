import { db } from "./db";
import { ApiError } from "./api";
import { hasPremium } from "./auth";

/**
 * Subscription limits. Enforced SERVER-SIDE in every create endpoint —
 * the UI may hint at limits but the API is the security boundary.
 */
export const PLAN_LIMITS = {
  free: { skills: 3, resources: 25, notes: 50, aiPerDay: 10 },
  premium: {
    skills: Number.POSITIVE_INFINITY,
    resources: Number.POSITIVE_INFINITY,
    notes: Number.POSITIVE_INFINITY,
    aiPerDay: 200,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export async function getPlan(): Promise<PlanName> {
  return (await hasPremium()) ? "premium" : "free";
}

type CountedEntity = "skills" | "resources" | "notes";

const countFns: Record<CountedEntity, (userId: string) => Promise<number>> = {
  skills: (userId) => db.skill.count({ where: { userId } }),
  resources: (userId) => db.resource.count({ where: { userId } }),
  notes: (userId) => db.note.count({ where: { userId } }),
};

/** Throw 403 if creating another `entity` would exceed the caller's plan. */
export async function assertWithinLimit(
  entity: CountedEntity,
  userId: string,
): Promise<void> {
  const plan = await getPlan();
  const limit = PLAN_LIMITS[plan][entity];
  if (!Number.isFinite(limit)) return;
  const count = await countFns[entity](userId);
  if (count >= limit) {
    throw new ApiError(
      403,
      `Free plan limit reached (${limit} ${entity}). Upgrade to Premium for unlimited ${entity}.`,
    );
  }
}

/** UTC day bucket used for AI quota metering. */
function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Atomically consume one AI request from today's quota, or throw 429.
 * Backed by a unique (userId, day) row so it is safe across serverless
 * instances — unlike in-memory counters.
 */
export async function consumeAiQuota(userId: string): Promise<void> {
  const plan = await getPlan();
  const limit = PLAN_LIMITS[plan].aiPerDay;
  const day = todayUtc();

  const usage = await db.aiUsage.upsert({
    where: { userId_day: { userId, day } },
    update: { count: { increment: 1 } },
    create: { userId, day, count: 1 },
  });

  if (usage.count > limit) {
    // Roll the increment back so retries tomorrow aren't penalized further.
    await db.aiUsage.update({
      where: { userId_day: { userId, day } },
      data: { count: { decrement: 1 } },
    });
    throw new ApiError(
      429,
      plan === "free"
        ? `Daily AI limit reached (${limit}/day on the Free plan). Upgrade to Premium for ${PLAN_LIMITS.premium.aiPerDay}/day.`
        : `Daily AI limit reached (${limit}/day).`,
    );
  }
}

/** Throw 403 unless the caller has the Premium plan (server-verified). */
export async function requirePremium(): Promise<void> {
  if (!(await hasPremium())) {
    throw new ApiError(403, "This feature requires the Premium plan.");
  }
}
