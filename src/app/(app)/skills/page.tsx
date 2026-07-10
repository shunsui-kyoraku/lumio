"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFetch, apiFetch } from "@/lib/client-api";
import {
  Card, Button, Input, TextArea, Select, Label, Modal, PageLoader, ProgressBar, EmptyState, Badge,
} from "@/components/ui";
import { IconPlus } from "@/components/icons";

interface Skill {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  progress: number;
  xp: number;
  tier: string;
  color: string;
  counts: { resources: number; notes: number; flashcards: number };
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#3b82f6"];

function TreeNode({ skill, childrenOf, depth }: {
  skill: Skill;
  childrenOf: Map<string | null, Skill[]>;
  depth: number;
}) {
  const children = childrenOf.get(skill.id) ?? [];
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 20 }} className={depth > 0 ? "border-l border-border pl-4" : ""}>
      <Link
        href={`/skills/${skill.id}`}
        className="group my-1.5 block rounded-xl border border-border bg-surface-2 p-3 transition hover:border-accent/50"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: skill.color }} />
            <span className="truncate font-medium group-hover:text-accent">{skill.name}</span>
            <Badge>{skill.tier}</Badge>
          </div>
          <span className="shrink-0 text-xs text-muted">{skill.progress}%</span>
        </div>
        <ProgressBar value={skill.progress} color={skill.color} className="mt-2" />
        <p className="mt-1.5 text-xs text-muted">
          {skill.counts.resources} resources · {skill.counts.notes} notes · {skill.counts.flashcards} cards
        </p>
      </Link>
      {children.map((c) => (
        <TreeNode key={c.id} skill={c} childrenOf={childrenOf} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function SkillsPage() {
  const { data, loading, error, refetch } = useFetch<{ skills: Skill[] }>("/api/skills");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "", parentId: "", difficulty: "BEGINNER", color: COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Skill[]>();
    for (const s of data?.skills ?? []) {
      const key = s.parentId ?? null;
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [data]);

  const create = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await apiFetch("/api/skills", {
        method: "POST",
        body: {
          name: form.name,
          description: form.description || null,
          category: form.category || null,
          parentId: form.parentId || null,
          difficulty: form.difficulty,
          color: form.color,
        },
      });
      setOpen(false);
      setForm({ name: "", description: "", category: "", parentId: "", difficulty: "BEGINNER", color: COLORS[0] });
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !data) return <p className="text-danger">{error}</p>;

  const roots = childrenOf.get(null) ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Skill tree</h1>
          <p className="mt-1 text-sm text-muted">Skills grow with every session, review and completed resource.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <IconPlus size={16} /> New skill
        </Button>
      </div>

      {roots.length === 0 ? (
        <EmptyState
          title="Plant your first skill"
          hint="Skills are the trunk of everything in SkillTree — resources, notes, flashcards and sessions all attach to them."
          action={<Button onClick={() => setOpen(true)}>Create a skill</Button>}
        />
      ) : (
        <Card>
          {roots.map((s) => (
            <TreeNode key={s.id} skill={s} childrenOf={childrenOf} depth={0} />
          ))}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New skill">
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. React" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <TextArea rows={2} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={form.category} maxLength={50} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Programming" />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((d) => (
                  <option key={d} value={d}>{d.toLowerCase()}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Parent skill (optional — builds the tree)</Label>
            <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">— top level —</option>
              {(data.skills ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`size-7 rounded-full cursor-pointer ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-surface" : ""}`}
                  style={{ background: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
          </div>
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Button onClick={create} disabled={saving || form.name.trim().length === 0} className="w-full">
            {saving ? "Creating…" : "Create skill"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
