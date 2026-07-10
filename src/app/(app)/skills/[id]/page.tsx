"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch, apiFetch } from "@/lib/client-api";
import { Card, Button, PageLoader, ProgressBar, Badge } from "@/components/ui";

interface SkillDetail {
  skill: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    difficulty: string;
    progress: number;
    xp: number;
    tier: string;
    color: string;
    children: { id: string; name: string; progress: number; color: string }[];
    resources: { id: string; title: string; type: string; status: string }[];
    notes: { id: string; title: string; tags: string[] }[];
    _count: { flashcards: number; sessions: number };
  };
}

const TIERS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error } = useFetch<SkillDetail>(`/api/skills/${id}`);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <PageLoader />;
  if (error || !data) return <p className="text-danger">{error ?? "Not found"}</p>;
  const s = data.skill;

  const remove = async () => {
    if (!confirm(`Delete skill "${s.name}"? Attached resources and notes keep existing but lose the link.`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/skills/${s.id}`, { method: "DELETE" });
      router.push("/skills");
    } finally {
      setDeleting(false);
    }
  };

  const tierIndex = TIERS.indexOf(s.tier);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <Link href="/skills" className="text-sm text-muted hover:text-text">← Skill tree</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-3 font-display text-3xl">
            <span className="size-4 rounded-full" style={{ background: s.color }} />
            {s.name}
          </h1>
          <Button variant="danger" onClick={remove} disabled={deleting}>Delete</Button>
        </div>
        {s.description && <p className="mt-2 max-w-xl text-sm text-muted">{s.description}</p>}
        <div className="mt-2 flex gap-2">
          {s.category && <Badge>{s.category}</Badge>}
          <Badge>{s.difficulty.toLowerCase()}</Badge>
          <Badge color={s.color}>{s.xp} XP</Badge>
        </div>
      </div>

      {/* Mastery ladder */}
      <Card>
        <h2 className="mb-4 font-display text-lg">Mastery — {s.tier}</h2>
        <div className="flex items-center gap-1">
          {TIERS.map((t, i) => (
            <div key={t} className="flex-1">
              <div
                className="h-2.5 rounded-full"
                style={{
                  background: i <= tierIndex ? s.color : "var(--color-surface-2)",
                  opacity: i <= tierIndex ? 1 - i * 0.12 : 1,
                }}
              />
              <p className={`mt-1.5 text-center text-[11px] ${i <= tierIndex ? "text-text" : "text-muted"}`}>{t}</p>
            </div>
          ))}
        </div>
        <ProgressBar value={s.progress} color={s.color} className="mt-4" />
        <p className="mt-1 text-xs text-muted">{s.progress}% · {s._count.sessions} sessions logged · {s._count.flashcards} flashcards</p>
      </Card>

      {s.children.length > 0 && (
        <Card>
          <h2 className="mb-3 font-display text-lg">Sub-skills</h2>
          <div className="space-y-3">
            {s.children.map((c) => (
              <Link key={c.id} href={`/skills/${c.id}`} className="block">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="hover:text-accent">{c.name}</span>
                  <span className="text-muted">{c.progress}%</span>
                </div>
                <ProgressBar value={c.progress} color={c.color} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Resources</h2>
            <Link href="/resources" className="text-sm text-accent hover:underline">Library →</Link>
          </div>
          {s.resources.length === 0 ? (
            <p className="text-sm text-muted">Nothing linked yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {s.resources.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{r.title}</span>
                  <Badge>{r.status.replaceAll("_", " ").toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Notes</h2>
            <Link href="/notes" className="text-sm text-accent hover:underline">All notes →</Link>
          </div>
          {s.notes.length === 0 ? (
            <p className="text-sm text-muted">No notes yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {s.notes.map((n) => (
                <li key={n.id}>
                  <Link href={`/notes/${n.id}`} className="hover:text-accent">{n.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
