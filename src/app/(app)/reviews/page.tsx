"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { Card, Button, PageLoader, EmptyState, Badge, Modal, Input, TextArea, Label, Select } from "@/components/ui";
import { IconPlus } from "@/components/icons";

interface QueueCard {
  id: string;
  front: string;
  back: string;
  skill: { id: string; name: string; color: string } | null;
}

export default function ReviewsPage() {
  const [queue, setQueue] = useState<QueueCard[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ front: "", back: "", skillId: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ queue: QueueCard[]; dueCount: number }>("/api/reviews");
      setQueue(data.queue);
      setDueCount(data.dueCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    apiFetch<{ skills: { id: string; name: string }[] }>("/api/skills")
      .then((d) => setSkills(d.skills))
      .catch(() => {});
  }, [load]);

  const current = queue[0];

  const grade = async (g: "EASY" | "MEDIUM" | "HARD") => {
    if (!current) return;
    setFlipped(false);
    setQueue((q) => q.slice(1));
    setDueCount((c) => Math.max(0, c - 1));
    setReviewed((r) => r + 1);
    try {
      await apiFetch("/api/reviews", { method: "POST", body: { flashcardId: current.id, grade: g } });
    } catch {
      // non-fatal: card will reappear on next load
    }
    if (queue.length <= 1) await load();
  };

  const createCard = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/flashcards", {
        method: "POST",
        body: { front: form.front, back: form.back, skillId: form.skillId || null },
      });
      setAddOpen(false);
      setForm({ front: "", back: "", skillId: "" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && queue.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Reviews</h1>
          <p className="mt-1 text-sm text-muted">
            {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? "" : "s"} due` : "All caught up"} ·
            spaced repetition (SM-2)
          </p>
        </div>
        <Button variant="ghost" onClick={() => setAddOpen(true)}>
          <IconPlus size={16} /> New card
        </Button>
      </div>

      {!current ? (
        <EmptyState
          title={reviewed > 0 ? `Session complete — ${reviewed} cards reviewed 🎉` : "No reviews due"}
          hint="Create flashcards by hand or let the AI assistant generate them from your material."
          action={
            <div className="flex gap-2">
              <Button onClick={() => setAddOpen(true)}>Create a card</Button>
              <Link href="/assistant">
                <Button variant="ghost">Generate with AI</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="mx-auto max-w-xl">
          <Card className="min-h-64">
            <div className="mb-3 flex items-center justify-between">
              {current.skill ? (
                <Badge color={current.skill.color}>{current.skill.name}</Badge>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted">{queue.length} in queue</span>
            </div>
            <p className="whitespace-pre-wrap text-lg">{current.front}</p>
            {flipped && (
              <>
                <hr className="my-4 border-border" />
                <p className="whitespace-pre-wrap text-text/90">{current.back}</p>
              </>
            )}
          </Card>

          <div className="mt-4">
            {!flipped ? (
              <Button onClick={() => setFlipped(true)} className="w-full">
                Show answer
              </Button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button variant="ghost" className="!border-danger/40" onClick={() => grade("HARD")}>
                  Hard
                </Button>
                <Button variant="ghost" className="!border-warning/40" onClick={() => grade("MEDIUM")}>
                  Medium
                </Button>
                <Button variant="ghost" className="!border-success/40" onClick={() => grade("EASY")}>
                  Easy
                </Button>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Hard = see it again tomorrow · Easy = much longer interval
          </p>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New flashcard">
        <div className="space-y-4">
          <div>
            <Label>Front (question)</Label>
            <Input value={form.front} maxLength={2000} onChange={(e) => setForm({ ...form, front: e.target.value })} />
          </div>
          <div>
            <Label>Back (answer)</Label>
            <TextArea rows={3} maxLength={2000} value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} />
          </div>
          <div>
            <Label>Skill (optional)</Label>
            <Select value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })}>
              <option value="">— none —</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <Button
            onClick={createCard}
            disabled={saving || !form.front.trim() || !form.back.trim()}
            className="w-full"
          >
            {saving ? "Creating…" : "Create card"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
