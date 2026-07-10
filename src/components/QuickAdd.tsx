"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Input, Select, Label } from "./ui";
import { apiFetch } from "@/lib/client-api";

interface SkillOption {
  id: string;
  name: string;
}

/** Global quick-add: log a learning session in two taps. */
export default function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [minutes, setMinutes] = useState(25);
  const [skillId, setSkillId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setDone(null);
    setError(null);
    apiFetch<{ skills: SkillOption[] }>("/api/skills")
      .then((d) => setSkills(d.skills))
      .catch(() => setSkills([]));
  }, [open]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ xpEarned: number }>("/api/sessions", {
        method: "POST",
        body: {
          minutes,
          skillId: skillId || null,
          note: note || null,
        },
      });
      setDone(res.xpEarned);
      router.refresh();
      setTimeout(() => {
        onClose();
        setNote("");
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log learning time">
      {done !== null ? (
        <p className="py-6 text-center text-lg">
          🎉 +{done} XP — nice work!
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Minutes</Label>
            <div className="flex gap-2">
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className={`flex-1 rounded-xl border px-2 py-2 text-sm cursor-pointer ${
                    minutes === m
                      ? "border-accent bg-accent/15 text-text"
                      : "border-border bg-surface-2 text-muted"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Skill (optional)</Label>
            <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">— none —</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>What did you work on? (optional)</Label>
            <Input
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. React hooks chapter 4"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={submit} disabled={saving || minutes < 1} className="w-full">
            {saving ? "Saving…" : `Log ${minutes} minutes`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
