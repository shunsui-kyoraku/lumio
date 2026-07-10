import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { ApiError } from "./api";
import type { User } from "@/generated/prisma/client";

/**
 * Resolve the authenticated app user, or throw 401.
 *
 * Clerk is the identity source of truth; the local row is normally created by
 * the Clerk webhook. If the webhook hasn't landed yet (first request right
 * after sign-up) we sync on demand — idempotent via upsert on clerkId.
 */
export async function requireUser(): Promise<User> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new ApiError(401, "Unauthorized");

  const existing = await db.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const cu = await currentUser();
  if (!cu) throw new ApiError(401, "Unauthorized");

  const email =
    cu.primaryEmailAddress?.emailAddress ??
    cu.emailAddresses[0]?.emailAddress ??
    `${clerkId}@users.noreply.skilltree.app`;
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null;

  return db.user.upsert({
    where: { clerkId },
    update: { email, name, imageUrl: cu.imageUrl },
    create: { clerkId, email, name, imageUrl: cu.imageUrl },
  });
}

/** Server-side plan check via Clerk Billing. Never trust the client for this. */
export async function hasPremium(): Promise<boolean> {
  const { userId, has } = await auth();
  if (!userId) return false;
  try {
    return has({ plan: "premium" });
  } catch {
    return false;
  }
}
