"use client";

import Link from "next/link";
import { useFetch } from "@/lib/client-api";
import { Card, PageLoader, ProgressBar, Badge } from "@/components/ui";
import ProgressRing from "@/components/ProgressRing";
import Heatmap from "@/components/Heatmap";
import { IconFlame, IconCards, IconClock, IconCheck } from "@/components/icons";

interface DashboardData {
  greetingName: string | null;
  today: {
    minutes: number;
    sessions: number;
    goalMinutes: number;
    reviewsDue: number;
    journalDone: boolean;
  };
  week: { minutes: number; targetHours: number; skillsImproved: number; progressPct: number };
  streak: { current: number; longest: number };
  xp: { total: number; level: number; title: string; progress: number };
  skills: { id: string; name: string; color: string; progress: number; tier: string }[];
  heatmap: Record<string, number>;
  recentAchievements: { code: string; unlockedAt: string }[];
  plan: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data, loading, error } = useFetch<DashboardData>("/api/dashboard");

  if (loading) return <PageLoader />;
  if (error || !data) return <p className="text-danger">{error ?? "Failed to load"}</p>;

  const goalRatio = data.today.goalMinutes > 0 ? data.today.minutes / data.today.goalMinutes : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">
            {greeting()}
            {data.greetingName ? `, ${data.greetingName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Level {data.xp.level} · {data.xp.title} · {data.xp.total.toLocaleString()} XP
            {data.plan === "premium" && (
              <Badge className="ml-2" color="#a78bfa">Premium</Badge>
            )}
          </p>
        </div>
        {data.today.reviewsDue > 0 && (
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <IconCards size={16} /> {data.today.reviewsDue} reviews waiting
          </Link>
        )}
      </div>

      {/* Today row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4">
          <ProgressRing value={goalRatio} size={84} stroke={8}>
            <span className="text-sm font-semibold">{Math.round(goalRatio * 100)}%</span>
          </ProgressRing>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Today&apos;s goal</p>
            <p className="mt-1 text-xl font-semibold">
              {data.today.minutes}
              <span className="text-sm font-normal text-muted"> / {data.today.goalMinutes} min</span>
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-warning">
            <IconFlame size={18} />
            <p className="text-xs uppercase tracking-wide text-muted">Current streak</p>
          </div>
          <p className="mt-2 text-3xl font-semibold">
            {data.streak.current}
            <span className="text-sm font-normal text-muted"> days</span>
          </p>
          <p className="mt-1 text-xs text-muted">Best: {data.streak.longest} days</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-accent">
            <IconClock size={18} />
            <p className="text-xs uppercase tracking-wide text-muted">This week</p>
          </div>
          <p className="mt-2 text-3xl font-semibold">
            {(data.week.minutes / 60).toFixed(1)}
            <span className="text-sm font-normal text-muted"> / {data.week.targetHours} h</span>
          </p>
          <ProgressBar value={data.week.progressPct} className="mt-2" />
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-success">
            <IconCheck size={18} />
            <p className="text-xs uppercase tracking-wide text-muted">Today</p>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Sessions</span>
              <span>{data.today.sessions}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Reviews due</span>
              <span>{data.today.reviewsDue}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Journal</span>
              <span>{data.today.journalDone ? "done ✓" : <Link className="text-accent" href="/journal">write →</Link>}</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Learning activity</h2>
          <p className="text-xs text-muted">last 12 months</p>
        </div>
        <Heatmap data={data.heatmap} />
      </Card>

      {/* Skills */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Skills</h2>
          <Link href="/skills" className="text-sm text-accent hover:underline">
            View skill tree →
          </Link>
        </div>
        {data.skills.length === 0 ? (
          <p className="text-sm text-muted">
            No skills yet.{" "}
            <Link href="/skills" className="text-accent hover:underline">
              Plant your first skill
            </Link>{" "}
            to start tracking progress.
          </p>
        ) : (
          <div className="space-y-3">
            {data.skills.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <Link href={`/skills/${s.id}`} className="hover:text-accent">
                    {s.name}
                  </Link>
                  <span className="text-xs text-muted">
                    {s.tier} · {s.progress}%
                  </span>
                </div>
                <ProgressBar value={s.progress} color={s.color} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {data.recentAchievements.length > 0 && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent achievements</h2>
            <Link href="/achievements" className="text-sm text-accent hover:underline">
              All →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.recentAchievements.map((a) => (
              <Badge key={a.code}>{a.code.replaceAll("_", " ").toLowerCase()}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
