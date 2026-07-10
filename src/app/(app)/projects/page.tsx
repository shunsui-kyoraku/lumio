"use client";

import { useState } from "react";
import { useFetch, apiFetch } from "@/lib/client-api";
import {
  Card, Button, Input, TextArea, Select, Label, Modal, PageLoader, EmptyState, Badge, ProgressBar,
} from "@/components/ui";
import { IconPlus, IconTrash, IconCheck } from "@/components/icons";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  minutesSpent: number;
  tasks: Task[];
  skills: { id: string; name: string; color: string }[];
}

const STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"];

export default function ProjectsPage() {
  const { data, loading, error, refetch } = useFetch<{ projects: Project[] }>("/api/projects");
  const skillsQuery = useFetch<{ skills: { id: string; name: string }[] }>("/api/skills");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", skillIds: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState<Record<string, string>>({});

  const create = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/projects", {
        method: "POST",
        body: { name: form.name, description: form.description || null, skillIds: form.skillIds },
      });
      setOpen(false);
      setForm({ name: "", description: "", skillIds: [] });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const addTask = async (projectId: string) => {
    const title = (newTask[projectId] ?? "").trim();
    if (!title) return;
    await apiFetch(`/api/projects/${projectId}/tasks`, { method: "POST", body: { title } });
    setNewTask({ ...newTask, [projectId]: "" });
    await refetch();
  };

  const toggleTask = async (projectId: string, task: Task) => {
    await apiFetch(`/api/projects/${projectId}/tasks/${task.id}`, {
      method: "PATCH",
      body: { done: !task.done },
    });
    await refetch();
  };

  const setStatus = async (p: Project, status: string) => {
    await apiFetch(`/api/projects/${p.id}`, { method: "PATCH", body: { status } });
    await refetch();
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    await apiFetch(`/api/projects/${p.id}`, { method: "DELETE" });
    await refetch();
  };

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <p className="text-danger">{error}</p>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-muted">Learning sticks when you build something with it.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <IconPlus size={16} /> New project
        </Button>
      </div>

      {(data?.projects ?? []).length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint="Break a build into tasks, link the skills it exercises, and track time against it."
          action={<Button onClick={() => setOpen(true)}>Start a project</Button>}
        />
      ) : (
        <div className="space-y-4">
          {data!.projects.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl">{p.name}</h2>
                  {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.skills.map((s) => (
                      <Badge key={s.id} color={s.color}>{s.name}</Badge>
                    ))}
                    {p.minutesSpent > 0 && <Badge>{Math.round(p.minutesSpent / 6) / 10}h logged</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={p.status} onChange={(e) => setStatus(p, e.target.value)} className="!w-32 !py-1 text-xs">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.toLowerCase()}</option>
                    ))}
                  </Select>
                  <button onClick={() => remove(p)} className="text-muted hover:text-danger cursor-pointer" aria-label="Delete project">
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={p.progress} className="flex-1" />
                <span className="text-xs text-muted">{p.progress}%</span>
              </div>

              <ul className="mt-4 space-y-1.5">
                {p.tasks.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => toggleTask(p.id, t)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2 cursor-pointer"
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                          t.done ? "border-accent bg-accent text-white" : "border-border"
                        }`}
                      >
                        {t.done && <IconCheck size={12} />}
                      </span>
                      <span className={t.done ? "text-muted line-through" : ""}>{t.title}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void addTask(p.id);
                }}
                className="mt-3 flex gap-2"
              >
                <Input
                  value={newTask[p.id] ?? ""}
                  maxLength={300}
                  onChange={(e) => setNewTask({ ...newTask, [p.id]: e.target.value })}
                  placeholder="Add a task…"
                />
                <Button type="submit" variant="ghost">Add</Button>
              </form>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New project">
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} maxLength={150} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Build a portfolio site" />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea rows={2} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Skills used</Label>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
              {(skillsQuery.data?.skills ?? []).map((s) => {
                const active = form.skillIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      setForm({
                        ...form,
                        skillIds: active
                          ? form.skillIds.filter((x) => x !== s.id)
                          : [...form.skillIds, s.id],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs cursor-pointer ${
                      active ? "border-accent bg-accent/20 text-text" : "border-border text-muted"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={create} disabled={saving || !form.name.trim()} className="w-full">
            {saving ? "Creating…" : "Create project"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
