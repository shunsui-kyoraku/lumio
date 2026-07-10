import { withApi, parseBody, json, notFound, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { noteUpdateSchema } from "@/lib/validation";
import { resolveLinks } from "@/lib/notes";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const note = await db.note.findFirst({
    where: { id, userId: user.id },
    include: {
      skill: { select: { id: true, name: true, color: true } },
      linksTo: { select: { id: true, title: true } },
      linksFrom: { select: { id: true, title: true } },
    },
  });
  if (!note) notFound();
  return json({ note });
});

export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const data = await parseBody(req, noteUpdateSchema);

  const existing = await db.note.findFirst({ where: { id, userId: user.id } });
  if (!existing) notFound();

  if (data.skillId) {
    const skill = await db.skill.findFirst({
      where: { id: data.skillId, userId: user.id },
      select: { id: true },
    });
    if (!skill) throw new ApiError(400, "Skill not found");
  }

  const content = data.content ?? existing.content;
  const links = await resolveLinks(user.id, content, existing.id);

  const note = await db.note.update({
    where: { id: existing.id },
    data: { ...data, linksTo: { set: links } },
    include: {
      linksTo: { select: { id: true, title: true } },
      linksFrom: { select: { id: true, title: true } },
    },
  });
  return json({ note });
});

export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const existing = await db.note.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) notFound();
  await db.note.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
