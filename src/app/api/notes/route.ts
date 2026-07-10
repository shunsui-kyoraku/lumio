import { withApi, parseBody, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertWithinLimit } from "@/lib/plans";
import { noteCreateSchema } from "@/lib/validation";
import { awardXp } from "@/lib/activity";
import { XP_REWARDS } from "@/lib/xp";
import { resolveLinks } from "@/lib/notes";

export const GET = withApi(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.slice(0, 200);
  const tag = url.searchParams.get("tag")?.slice(0, 30);
  const skillId = url.searchParams.get("skillId") ?? undefined;

  const notes = await db.note.findMany({
    where: {
      userId: user.id,
      ...(skillId ? { skillId } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      tags: true,
      skillId: true,
      updatedAt: true,
      skill: { select: { name: true, color: true } },
      content: true,
    },
  });

  return json({
    notes: notes.map((n) => ({
      ...n,
      excerpt: n.content.slice(0, 160),
      content: undefined,
    })),
  });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  await assertWithinLimit("notes", user.id);
  const data = await parseBody(req, noteCreateSchema);

  if (data.skillId) {
    const skill = await db.skill.findFirst({
      where: { id: data.skillId, userId: user.id },
      select: { id: true },
    });
    if (!skill) throw new ApiError(400, "Skill not found");
  }

  const links = await resolveLinks(user.id, data.content ?? "");
  const note = await db.note.create({
    data: {
      userId: user.id,
      title: data.title,
      content: data.content ?? "",
      tags: data.tags ?? [],
      skillId: data.skillId ?? null,
      linksTo: { connect: links },
    },
  });
  await awardXp(user.id, XP_REWARDS.NOTE_CREATED);
  return json({ note }, { status: 201 });
});
