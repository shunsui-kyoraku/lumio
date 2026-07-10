"use client";

import { useEffect, useState } from "react";
import { useFetch, apiFetch } from "@/lib/client-api";
import { Card, Button, TextArea, Label, PageLoader } from "@/components/ui";

interface Entry {
  id: string;
  date: string;
  learned: string | null;
  difficult: string | null;
  questions: string | null;
  confidence: number;
}

const CONFIDENCE = ["😵", "😕", "😐", "🙂", "😎"];

export default function JournalPage() {
  const { data, loading, error, refetch } = useFetch<{ entries: Entry[] }>("/api/journal");
  const [learned, setLearned] = useState("");
  const [difficult, setDifficult] = useState("");
  const [questions, setQuestions] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!data || hydrated) return;
    const today = data.entries.find((e) => e.date.slice(0, 10) === todayKey);
    if (today) {
      setLearned(today.learned ?? "");
      setDifficult(today.difficult ?? "");
      setQuestions(today.questions ?? "");
      setConfidence(today.confidence);
    }
    setHydrated(true);
  }, [data, hydrated, todayKey]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/journal", {
        method: "POST",
        body: {
          learned: learned || null,
          difficult: difficult || null,
          questions: questions || null,
          confidence,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <p className="text-danger">{error}</p>;

  const past = (data?.entries ?? []).filter((e) => e.date.slice(0, 10) !== todayKey);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl">Learning journal</h1>
        <p className="mt-1 text-sm text-muted">Two minutes of reflection cements the day&apos;s learning.</p>
      </div>

      <Card>
        <h2 className="mb-4 font-display text-lg">
          Today · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        <div className="space-y-4">
          <div>
            <Label>What did you learn today?</Label>
            <TextArea rows={3} maxLength={5000} value={learned} onChange={(e) => setLearned(e.target.value)} />
          </div>
          <div>
            <Label>What was difficult?</Label>
            <TextArea rows={2} maxLength={5000} value={difficult} onChange={(e) => setDifficult(e.target.value)} />
          </div>
          <div>
            <Label>What questions remain?</Label>
            <TextArea rows={2} maxLength={5000} value={questions} onChange={(e) => setQuestions(e.target.value)} />
          </div>
          <div>
            <Label>How confident are you?</Label>
            <div className="flex gap-2">
              {CONFIDENCE.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setConfidence(i + 1)}
                  className={`flex-1 rounded-xl border py-2 text-xl cursor-pointer transition ${
                    confidence === i + 1 ? "border-accent bg-accent/15" : "border-border bg-surface-2 opacity-60"
                  }`}
                  aria-label={`Confidence ${i + 1} of 5`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save today's entry"}
          </Button>
        </div>
      </Card>

      {past.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg">Timeline</h2>
          <div className="space-y-3 border-l-2 border-border pl-5">
            {past.map((e) => (
              <Card key={e.id} className="relative !p-4">
                <span className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-bg bg-accent" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <span className="text-lg">{CONFIDENCE[e.confidence - 1]}</span>
                </div>
                {e.learned && <p className="mt-1.5 whitespace-pre-wrap text-sm text-text/85">{e.learned}</p>}
                {e.difficult && (
                  <p className="mt-1 text-xs text-muted">
                    <span className="text-warning">Difficult:</span> {e.difficult}
                  </p>
                )}
                {e.questions && (
                  <p className="mt-1 text-xs text-muted">
                    <span className="text-accent">Open questions:</span> {e.questions}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
