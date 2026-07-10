"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFetch, apiFetch } from "@/lib/client-api";
import { Card, Button, Input, TextArea, Select, Label, PageLoader, Badge } from "@/components/ui";

interface Me {
  name: string | null;
  email: string;
  learningGoals: string | null;
  currentSkills: string | null;
  learningStyle: string;
  dailyGoalMinutes: number;
  weeklyTargetHours: number;
  timezone: string;
  plan: string;
  limits: { skills: number | null; aiPerDay: number };
}

export default function SettingsPage() {
  const { data, loading, error } = useFetch<Me>("/api/me");
  const [form, setForm] = useState({
    learningGoals: "",
    currentSkills: "",
    learningStyle: "MIXED",
    dailyGoalMinutes: 30,
    weeklyTargetHours: 5,
  });
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  useEffect(() => {
    if (data && !hydrated) {
      setForm({
        learningGoals: data.learningGoals ?? "",
        currentSkills: data.currentSkills ?? "",
        learningStyle: data.learningStyle,
        dailyGoalMinutes: data.dailyGoalMinutes,
        weeklyTargetHours: data.weeklyTargetHours,
      });
      setHydrated(true);
    }
  }, [data, hydrated]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem("st-theme", next);
    } catch {
      /* private mode */
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/me", {
        method: "PATCH",
        body: {
          learningGoals: form.learningGoals || null,
          currentSkills: form.currentSkills || null,
          learningStyle: form.learningStyle,
          dailyGoalMinutes: form.dailyGoalMinutes,
          weeklyTargetHours: form.weeklyTargetHours,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !data) return <p className="text-danger">{error}</p>;

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="font-display text-3xl">Settings</h1>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Account & security</h2>
            <p className="mt-1 text-sm text-muted">
              {data.email} — profile, password, MFA and sessions are managed by Clerk.
            </p>
          </div>
          <Link href="/user-profile">
            <Button variant="ghost">Manage account →</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">
              Subscription{" "}
              <Badge color={data.plan === "premium" ? "#a78bfa" : undefined} className="ml-1 align-middle">
                {data.plan}
              </Badge>
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data.plan === "premium"
                ? `Premium — ${data.limits.aiPerDay} AI requests/day, unlimited everything.`
                : `Free — 3 skills, ${data.limits.aiPerDay} AI requests/day.`}
            </p>
          </div>
          <Link href="/pricing">
            <Button variant={data.plan === "premium" ? "ghost" : "primary"}>
              {data.plan === "premium" ? "Manage plan" : "Upgrade"}
            </Button>
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg">Appearance</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Theme</p>
          <Button variant="ghost" onClick={toggleTheme}>
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"} — switch
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg">Learning profile</h2>
        <div className="space-y-4">
          <div>
            <Label>Learning goals</Label>
            <TextArea
              rows={3}
              maxLength={2000}
              value={form.learningGoals}
              onChange={(e) => setForm({ ...form, learningGoals: e.target.value })}
              placeholder="What do you want to achieve this year?"
            />
          </div>
          <div>
            <Label>Current skills (summary)</Label>
            <TextArea
              rows={2}
              maxLength={2000}
              value={form.currentSkills}
              onChange={(e) => setForm({ ...form, currentSkills: e.target.value })}
              placeholder="e.g. Intermediate JavaScript, basic SQL…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Preferred learning style</Label>
              <Select
                value={form.learningStyle}
                onChange={(e) => setForm({ ...form, learningStyle: e.target.value })}
              >
                {["VISUAL", "AUDITORY", "READING", "KINESTHETIC", "MIXED"].map((s) => (
                  <option key={s} value={s}>{s.toLowerCase()}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Daily goal (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={600}
                value={form.dailyGoalMinutes}
                onChange={(e) => setForm({ ...form, dailyGoalMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Weekly target (hours)</Label>
              <Input
                type="number"
                min={1}
                max={80}
                value={form.weeklyTargetHours}
                onChange={(e) => setForm({ ...form, weeklyTargetHours: Number(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
