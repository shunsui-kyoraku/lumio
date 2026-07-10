"use client";

import { useState } from "react";
import { useFetch, apiFetch } from "@/lib/client-api";
import {
  Card, Button, Input, Select, Label, Modal, PageLoader, EmptyState, Badge, TextArea,
} from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/icons";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string | null;
  author: string | null;
  category: string | null;
  difficulty: string;
  status: string;
  difficultyRating: number | null;
  qualityRating: number | null;
  skill: { id: string; name: string; color: string } | null;
}

const TYPES = ["BOOK", "VIDEO", "COURSE", "ARTICLE", "PDF", "PODCAST", "PROJECT", "CERTIFICATION", "OTHER"];
const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "MASTERED"];
const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "Learning",
  COMPLETED: "Completed",
  MASTERED: "Mastered",
};
const TYPE_EMOJI: Record<string, string> = {
  BOOK: "📕", VIDEO: "🎬", COURSE: "🎓", ARTICLE: "📰", PDF: "📄",
  PODCAST: "🎧", PROJECT: "🛠️", CERTIFICATION: "📜", OTHER: "📌",
};

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? 0 : i)}
          className={`cursor-pointer text-lg ${i <= value ? "text-warning" : "text-border"}`}
          aria-label={`${i} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const emptyForm = {
  title: "", type: "BOOK", url: "", author: "", category: "", skillId: "",
  difficulty: "BEGINNER", status: "NOT_STARTED", difficultyRating: 0, qualityRating: 0, notes: "",
};

export default function ResourcesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, loading, error, refetch } = useFetch<{ resources: Resource[] }>(
    `/api/resources${statusFilter ? `?status=${statusFilter}` : ""}`,
  );
  const skillsQuery = useFetch<{ skills: { id: string; name: string }[] }>("/api/skills");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const create = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await apiFetch("/api/resources", {
        method: "POST",
        body: {
          title: form.title,
          type: form.type,
          url: form.url || null,
          author: form.author || null,
          category: form.category || null,
          skillId: form.skillId || null,
          difficulty: form.difficulty,
          status: form.status,
          difficultyRating: form.difficultyRating || null,
          qualityRating: form.qualityRating || null,
          notes: form.notes || null,
        },
      });
      setOpen(false);
      setForm(emptyForm);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (r: Resource, status: string) => {
    await apiFetch(`/api/resources/${r.id}`, { method: "PATCH", body: { status } });
    await refetch();
  };

  const remove = async (r: Resource) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    await apiFetch(`/api/resources/${r.id}`, { method: "DELETE" });
    await refetch();
  };

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <p className="text-danger">{error}</p>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Library</h1>
          <p className="mt-1 text-sm text-muted">Everything you&apos;re learning from, connected to skills.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </Select>
          <Button onClick={() => setOpen(true)}>
            <IconPlus size={16} /> Add
          </Button>
        </div>
      </div>

      {(data?.resources ?? []).length === 0 ? (
        <EmptyState
          title="Your library is empty"
          hint="Add the book, course or video you're currently learning from."
          action={<Button onClick={() => setOpen(true)}>Add a resource</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data!.resources.map((r) => (
            <Card key={r.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <span className="mr-1.5">{TYPE_EMOJI[r.type] ?? "📌"}</span>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                        {r.title}
                      </a>
                    ) : (
                      r.title
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {[r.author, r.category].filter(Boolean).join(" · ") || r.type.toLowerCase()}
                  </p>
                </div>
                <button onClick={() => remove(r)} className="shrink-0 text-muted hover:text-danger cursor-pointer" aria-label="Delete">
                  <IconTrash size={15} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select
                  value={r.status}
                  onChange={(e) => setStatus(r, e.target.value)}
                  className="!w-36 !py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </Select>
                {r.skill && <Badge color={r.skill.color}>{r.skill.name}</Badge>}
                {r.qualityRating ? (
                  <span className="text-xs text-warning">{"★".repeat(r.qualityRating)}</span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add resource" wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t.toLowerCase()}</option>)}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>URL (optional)</Label>
            <Input value={form.url} maxLength={2000} placeholder="https://…" onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <Label>Author</Label>
            <Input value={form.author} maxLength={120} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category} maxLength={50} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <Label>Skill</Label>
            <Select value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })}>
              <option value="">— none —</option>
              {(skillsQuery.data?.skills ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Level</Label>
            <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((d) => (
                <option key={d} value={d}>{d.toLowerCase()}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Difficulty rating</Label>
            <Stars value={form.difficultyRating} onChange={(v) => setForm({ ...form, difficultyRating: v })} />
          </div>
          <div>
            <Label>Quality rating</Label>
            <Stars value={form.qualityRating} onChange={(v) => setForm({ ...form, qualityRating: v })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <TextArea rows={2} maxLength={5000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
        <Button onClick={create} disabled={saving || form.title.trim().length === 0} className="mt-4 w-full">
          {saving ? "Adding…" : "Add to library"}
        </Button>
      </Modal>
    </div>
  );
}
