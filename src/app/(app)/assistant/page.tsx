"use client";

import { useState } from "react";
import { apiFetch, useFetch } from "@/lib/client-api";
import { Card, Button, Input, TextArea, Select, Label, Badge, Spinner } from "@/components/ui";
import Markdown from "@/components/Markdown";
import Link from "next/link";

type Tab = "summarize" | "explain" | "quiz" | "plan" | "search";

const TABS: { id: Tab; label: string; premium?: boolean }[] = [
  { id: "summarize", label: "Summarize" },
  { id: "explain", label: "Explain" },
  { id: "quiz", label: "Quiz me" },
  { id: "plan", label: "Learning plan", premium: true },
  { id: "search", label: "My knowledge", premium: true },
];

interface SummarizeResult {
  summary: string;
  keyConcepts: string[];
  keyTerms: { term: string; definition: string }[];
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; answerIndex: number }[];
  savedFlashcards: number;
}

interface QuizResult {
  questions: { question: string; options: string[]; answerIndex: number; explanation: string }[];
}

interface PlanResult {
  weeks: { week: number; focus: string; topics: string[]; practice: string }[];
}

export default function AssistantPage() {
  const me = useFetch<{ plan: string; limits: { aiPerDay: number } }>("/api/me");
  const [tab, setTab] = useState<Tab>("summarize");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // summarize
  const [material, setMaterial] = useState("");
  const [saveCards, setSaveCards] = useState(true);
  const [sumResult, setSumResult] = useState<SummarizeResult | null>(null);
  // explain
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [explanation, setExplanation] = useState<string | null>(null);
  // quiz
  const [quizTopic, setQuizTopic] = useState("");
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  // plan
  const [planTopic, setPlanTopic] = useState("");
  const [weeks, setWeeks] = useState(8);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  // search
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{ answer: string; sources: { notes: string[]; resources: string[] } } | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const isPremium = me.data?.plan === "premium";

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl">AI assistant</h1>
        <p className="mt-1 text-sm text-muted">
          Powered by Claude · {me.data ? `${me.data.limits.aiPerDay} requests/day on your plan` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl border px-4 py-2 text-sm cursor-pointer transition ${
              tab === t.id ? "border-accent bg-accent/15 text-text" : "border-border bg-surface text-muted"
            }`}
          >
            {t.label}
            {t.premium && !isPremium && <span className="ml-1.5 text-[10px] text-accent">PRO</span>}
          </button>
        ))}
      </div>

      {error && (
        <Card className="!border-danger/40">
          <p className="text-sm text-danger">{error}</p>
          {error.includes("Premium") && (
            <Link href="/pricing" className="mt-1 inline-block text-sm text-accent hover:underline">
              See Premium →
            </Link>
          )}
        </Card>
      )}

      {/* ---- Summarize ---- */}
      {tab === "summarize" && (
        <div className="space-y-4">
          <Card>
            <Label>Paste learning material (lecture notes, article, transcript…)</Label>
            <TextArea
              rows={8}
              maxLength={30000}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Paste at least a few paragraphs…"
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={saveCards}
                  onChange={(e) => setSaveCards(e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
                Save generated flashcards to my deck
              </label>
              <Button
                disabled={busy || material.trim().length < 50}
                onClick={() =>
                  run(async () => {
                    setSumResult(
                      await apiFetch<SummarizeResult>("/api/ai/summarize", {
                        method: "POST",
                        body: { text: material, saveFlashcards: saveCards },
                      }),
                    );
                  })
                }
              >
                {busy ? <Spinner className="!size-4" /> : "Create study kit"}
              </Button>
            </div>
          </Card>

          {sumResult && (
            <>
              <Card>
                <h2 className="mb-2 font-display text-lg">Summary</h2>
                <Markdown source={sumResult.summary} />
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <h3 className="mb-2 font-display">Key concepts</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {sumResult.keyConcepts.map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="mb-2 font-display">Key terms</h3>
                  <ul className="space-y-1.5 text-sm">
                    {sumResult.keyTerms.map((t) => (
                      <li key={t.term}>
                        <span className="font-medium">{t.term}</span>
                        <span className="text-muted"> — {t.definition}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
              <Card>
                <h3 className="mb-2 font-display">
                  Flashcards{" "}
                  {sumResult.savedFlashcards > 0 && (
                    <span className="text-sm font-normal text-success">
                      ({sumResult.savedFlashcards} saved to your deck ✓)
                    </span>
                  )}
                </h3>
                <ul className="space-y-2 text-sm">
                  {sumResult.flashcards.map((f, i) => (
                    <li key={i} className="rounded-xl border border-border bg-surface-2 p-3">
                      <p className="font-medium">{f.front}</p>
                      <p className="mt-1 text-muted">{f.back}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ---- Explain ---- */}
      {tab === "explain" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <Label>Concept</Label>
                <Input value={concept} maxLength={300} onChange={(e) => setConcept(e.target.value)} placeholder="e.g. recursion" />
              </div>
              <div>
                <Label>Your level</Label>
                <Select value={level} onChange={(e) => setLevel(e.target.value)} className="!w-44">
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((d) => (
                    <option key={d} value={d}>{d.toLowerCase()}</option>
                  ))}
                </Select>
              </div>
              <Button
                disabled={busy || concept.trim().length < 2}
                onClick={() =>
                  run(async () => {
                    const res = await apiFetch<{ explanation: string }>("/api/ai/explain", {
                      method: "POST",
                      body: { concept, level },
                    });
                    setExplanation(res.explanation);
                  })
                }
              >
                {busy ? <Spinner className="!size-4" /> : "Explain"}
              </Button>
            </div>
          </Card>
          {explanation && (
            <Card>
              <Markdown source={explanation} />
            </Card>
          )}
        </div>
      )}

      {/* ---- Quiz ---- */}
      {tab === "quiz" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <Label>Topic</Label>
                <Input value={quizTopic} maxLength={200} onChange={(e) => setQuizTopic(e.target.value)} placeholder="e.g. SQL joins" />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={level} onChange={(e) => setLevel(e.target.value)} className="!w-44">
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((d) => (
                    <option key={d} value={d}>{d.toLowerCase()}</option>
                  ))}
                </Select>
              </div>
              <Button
                disabled={busy || quizTopic.trim().length < 2}
                onClick={() =>
                  run(async () => {
                    setAnswers({});
                    setQuiz(
                      await apiFetch<QuizResult>("/api/ai/quiz", {
                        method: "POST",
                        body: { topic: quizTopic, count: 5, difficulty: level },
                      }),
                    );
                  })
                }
              >
                {busy ? <Spinner className="!size-4" /> : "Generate quiz"}
              </Button>
            </div>
          </Card>
          {quiz &&
            quiz.questions.map((q, qi) => {
              const picked = answers[qi];
              return (
                <Card key={qi}>
                  <p className="font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => {
                      const isPicked = picked === oi;
                      const isCorrect = q.answerIndex === oi;
                      const show = picked !== undefined;
                      return (
                        <button
                          key={oi}
                          disabled={show}
                          onClick={() => setAnswers({ ...answers, [qi]: oi })}
                          className={`block w-full rounded-xl border px-3 py-2 text-left text-sm cursor-pointer disabled:cursor-default ${
                            show && isCorrect
                              ? "border-success bg-success/10"
                              : show && isPicked
                                ? "border-danger bg-danger/10"
                                : "border-border bg-surface-2 hover:border-accent/50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== undefined && (
                    <p className="mt-3 text-sm text-muted">
                      {picked === q.answerIndex ? "✓ Correct. " : "✗ Not quite. "}
                      {q.explanation}
                    </p>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      {/* ---- Plan (premium) ---- */}
      {tab === "plan" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <Label>What do you want to learn?</Label>
                <Input value={planTopic} maxLength={200} onChange={(e) => setPlanTopic(e.target.value)} placeholder="e.g. Python for data analysis" />
              </div>
              <div>
                <Label>Weeks</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                  className="!w-24"
                />
              </div>
              <Button
                disabled={busy || planTopic.trim().length < 3}
                onClick={() =>
                  run(async () => {
                    setPlan(
                      await apiFetch<PlanResult>("/api/ai/plan", {
                        method: "POST",
                        body: { topic: planTopic, weeks, level: "BEGINNER" },
                      }),
                    );
                  })
                }
              >
                {busy ? <Spinner className="!size-4" /> : "Build plan"}
              </Button>
            </div>
            {!isPremium && (
              <p className="mt-3 text-xs text-muted">
                Learning plans are a Premium feature.{" "}
                <Link href="/pricing" className="text-accent hover:underline">Upgrade →</Link>
              </p>
            )}
          </Card>
          {plan && (
            <div className="space-y-3">
              {plan.weeks.map((w) => (
                <Card key={w.week} className="!p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/20 font-mono text-sm text-accent">
                      W{w.week}
                    </span>
                    <p className="font-medium">{w.focus}</p>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {w.topics.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    <span className="text-success">Practice:</span> {w.practice}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Knowledge search (premium) ---- */}
      {tab === "search" && (
        <div className="space-y-4">
          <Card>
            <Label>Ask about anything you&apos;ve studied</Label>
            <div className="flex gap-2">
              <Input
                value={query}
                maxLength={300}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "What did I learn about databases?"'
              />
              <Button
                disabled={busy || query.trim().length < 3}
                onClick={() =>
                  run(async () => {
                    setSearchResult(
                      await apiFetch("/api/ai/search", { method: "POST", body: { query } }),
                    );
                  })
                }
              >
                {busy ? <Spinner className="!size-4" /> : "Search"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Answers are grounded only in your own notes and library.
              {!isPremium && (
                <>
                  {" "}Premium feature — <Link href="/pricing" className="text-accent hover:underline">upgrade</Link>.
                </>
              )}
            </p>
          </Card>
          {searchResult && (
            <Card>
              <Markdown source={searchResult.answer} />
              {(searchResult.sources.notes.length > 0 || searchResult.sources.resources.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  <span className="text-xs text-muted">Sources:</span>
                  {searchResult.sources.notes.map((n) => (
                    <Badge key={`n-${n}`}>📝 {n}</Badge>
                  ))}
                  {searchResult.sources.resources.map((r) => (
                    <Badge key={`r-${r}`}>📚 {r}</Badge>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
