import { db } from "./db";
import { extractWikiLinks } from "./markdown";

/** Resolve [[wiki links]] in content to this user's notes (by exact title). */
export async function resolveLinks(
  userId: string,
  content: string,
  excludeId?: string,
): Promise<{ id: string }[]> {
  const titles = extractWikiLinks(content);
  if (titles.length === 0) return [];
  const linked = await db.note.findMany({
    where: { userId, title: { in: titles }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  return linked.map((n) => ({ id: n.id }));
}
