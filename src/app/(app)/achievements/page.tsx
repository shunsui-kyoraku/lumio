"use client";

import { useFetch } from "@/lib/client-api";
import { Card, PageLoader } from "@/components/ui";

interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

export default function AchievementsPage() {
  const { data, loading, error } = useFetch<{ achievements: Achievement[] }>("/api/achievements");

  if (loading) return <PageLoader />;
  if (error || !data) return <p className="text-danger">{error}</p>;

  const unlocked = data.achievements.filter((a) => a.unlockedAt);
  const locked = data.achievements.filter((a) => !a.unlockedAt);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl">Achievements</h1>
        <p className="mt-1 text-sm text-muted">
          {unlocked.length} of {data.achievements.length} unlocked
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...unlocked, ...locked].map((a) => (
          <Card
            key={a.code}
            className={`!p-4 ${a.unlockedAt ? "border-accent/40" : "opacity-50 grayscale"}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{a.icon}</span>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="mt-0.5 text-xs text-muted">{a.description}</p>
                {a.unlockedAt && (
                  <p className="mt-1 text-[11px] text-success">
                    Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
