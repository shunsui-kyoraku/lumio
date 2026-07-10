"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch, apiFetch } from "@/lib/client-api";
import { Card, Button, Input, TextArea, Select, PageLoader, Badge } from "@/components/ui";
import Markdown from "@/components/Markdown";

interface NoteDetail {
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    skillId: string | null;
    skill: { id: string; name: string; color: string } | null;
    linksTo: { id: string; title: string }[];
    linksFrom: { id: string; title: string }[];
  };
}

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch<NoteDetail>(`/api/notes/${id}`);
  const skillsQuery = useFetch<{ skills: { id: string; name: string }[] }>("/api/skills");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [skillId, setSkillId] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data && !loaded.current) {
      loaded.current = true;
      setTitle(data.note.title);
      setContent(data.note.content);
      setTags(data.note.tags.join(", "));
      setSkillId(data.note.skillId ?? "");
    }
  }, [data]);

  const save = async (patch?: Record<string, unknown>) => {
    setStatus("saving");
    try {
      await apiFetch(`/api/notes/${id}`, {
        method: "PATCH",
        body: {
          title: title.trim() || "Untitled note",
          content,
          tags: tags
            .split(",")
            .map((t) => t.trim().replace(/^#/, ""))
            .filter(Boolean)
            .slice(0, 10),
          skillId: skillId || null,
          ...patch,
        },
      });
      setStatus("saved");
      await refetch();
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  };

  // Debounced autosave on content changes after initial load
  useEffect(() => {
    if (!loaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), 1800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, skillId]);

  const remove = async () => {
    if (!confirm("Delete this note?")) return;
    await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
    router.push("/notes");
  };

  if (loading) return <PageLoader />;
  if (error || !data) return <p className="text-danger">{error ?? "Not found"}</p>;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/notes" className="text-sm text-muted hover:text-text">← Notes</Link>
        <div className="flex items-center gap-3 text-xs text-muted">
          {status === "saving" && <span>Saving…</span>}
          {status === "saved" && <span className="text-success">Saved ✓</span>}
          {status === "error" && <span className="text-danger">Save failed</span>}
          <Button variant="ghost" onClick={() => setMode(mode === "edit" ? "preview" : "edit")}>
            {mode === "edit" ? "Preview" : "Edit"}
          </Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </div>

      <Input
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        className="!bg-transparent !border-0 !px-0 !text-2xl font-display focus:!border-0"
        placeholder="Note title"
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-48 flex-1">
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags, comma, separated"
          />
        </div>
        <Select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="!w-52">
          <option value="">no linked skill</option>
          {(skillsQuery.data?.skills ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </div>

      {mode === "edit" ? (
        <TextArea
          rows={18}
          maxLength={50000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"Write in markdown…\n\n# Heading\n**bold**, *italic*, `code`\n- lists\n[[Link to another note]]"}
          className="font-mono !text-[13px] leading-relaxed"
        />
      ) : (
        <Card>
          <Markdown source={content || "*Nothing here yet.*"} />
        </Card>
      )}

      {(data.note.linksTo.length > 0 || data.note.linksFrom.length > 0) && (
        <Card className="!p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Connected:</span>
            {data.note.linksTo.map((l) => (
              <Link key={l.id} href={`/notes/${l.id}`}>
                <Badge className="hover:border-accent">→ {l.title}</Badge>
              </Link>
            ))}
            {data.note.linksFrom.map((l) => (
              <Link key={`f-${l.id}`} href={`/notes/${l.id}`}>
                <Badge className="hover:border-accent">← {l.title}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
