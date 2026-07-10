import { withApi, parseBody, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consumeAiQuota, requirePremium } from "@/lib/plans";
import { aiSearchSchema } from "@/lib/validation";
import { answerFromKnowledge } from "@/lib/ai";

/**
 * Personal knowledge search (Premium). Retrieval is scoped STRICTLY to the
 * caller's own notes and resources — the model never sees other users' data.
 */
export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  await requirePremium();
  const { query } = await parseBody(req, aiSearchSchema);
  await consumeAiQuota(user.id);

  // Cheap keyword retrieval: split the query into terms, match any.
  const terms = query
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((t) => t.length >= 3)
    .slice(0, 6);
  const searchTerms = terms.length > 0 ? terms : [query];

  const [notes, resources] = await Promise.all([
    db.note.findMany({
      where: {
        userId: user.id,
        OR: searchTerms.flatMap((t) => [
          { title: { contains: t, mode: "insensitive" as const } },
          { content: { contains: t, mode: "insensitive" as const } },
          { tags: { has: t.toLowerCase() } },
        ]),
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { title: true, content: true, updatedAt: true },
    }),
    db.resource.findMany({
      where: {
        userId: user.id,
        OR: searchTerms.flatMap((t) => [
          { title: { contains: t, mode: "insensitive" as const } },
          { notes: { contains: t, mode: "insensitive" as const } },
        ]),
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { title: true, type: true, status: true, notes: true },
    }),
  ]);

  const answer = await answerFromKnowledge(query, {
    notes: notes.map((n) => ({
      title: n.title,
      content: n.content.slice(0, 4000),
      updatedAt: n.updatedAt.toISOString().slice(0, 10),
    })),
    resources,
  });

  return json({
    answer,
    sources: {
      notes: notes.map((n) => n.title),
      resources: resources.map((r) => r.title),
    },
  });
});
