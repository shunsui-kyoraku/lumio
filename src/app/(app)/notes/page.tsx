"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch, apiFetch } from "@/lib/client-api";
import { Card, Button, Input, PageLoader, EmptyState, Badge } from "@/components/ui";
import { IconPlus, IconSearch } from "@/components/icons";

interface NoteListItem {
  id: string;
  title: string;
  tags: string[];
  excerpt: string;
  updatedAt: string;
  skill: { name: string; color: string } | null;
}

export default function NotesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const { data, loading, error } = useFetch<{ notes: NoteListItem[] }>(
    `/api/notes${search ? `?q=${encodeURIComponent(search)}` : ""}`,
  );
  const [creating, setCreating] = useState(false);

  const createNote = async () => {
    setCreating(true);
    try {
      const res = await apiFetch<{ note: { id: string } }>("/api/notes", {
        method: "POST",
        body: { title: "Untitled note", content: "" },
      });
      router.push(`/notes/${res.note.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
      setCreating(false);
    }
  };

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <p className="text-danger">{error}</p>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Notes</h1>
          <p className="mt-1 text-sm text-muted">Markdown with tags and [[wiki links]] between notes.</p>
        </div>
        <Button onClick={createNote} disabled={creating}>
          <IconPlus size={16} /> New note
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(query);
        }}
        className="relative"
      >
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes… (press Enter)"
          className="!pl-9"
        />
      </form>

      {(data?.notes ?? []).length === 0 ? (
        <EmptyState
          title={search ? "No notes match your search" : "No notes yet"}
          hint="Notes link to skills and to each other — your personal knowledge graph starts with one."
          action={!search ? <Button onClick={createNote}>Write your first note</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data!.notes.map((n) => (
            <Link key={n.id} href={`/notes/${n.id}`}>
              <Card className="h-full !p-4 transition hover:border-accent/50">
                <p className="font-medium">{n.title}</p>
                {n.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted">{n.excerpt}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.skill && <Badge color={n.skill.color}>{n.skill.name}</Badge>}
                  {n.tags.map((t) => (
                    <Badge key={t}>#{t}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
