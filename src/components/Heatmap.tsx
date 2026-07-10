"use client";

import { useMemo } from "react";

/**
 * GitHub-style calendar heatmap of learning minutes.
 * `data` maps ISO dates (YYYY-MM-DD) to minutes.
 */
export default function Heatmap({ data }: { data: Record<string, number> }) {
  const { weeks, max } = useMemo(() => {
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const days: { key: string; minutes: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(todayUtc.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, minutes: data[key] ?? 0 });
    }
    // pad so columns align to weeks
    const firstDow = new Date(`${days[0].key}T00:00:00Z`).getUTCDay();
    const padded = [...Array.from({ length: firstDow }, () => null), ...days];
    const weeks: (typeof days[number] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    const max = Math.max(30, ...days.map((d) => d.minutes));
    return { weeks, max };
  }, [data]);

  const level = (minutes: number) => {
    if (minutes === 0) return 0;
    const ratio = minutes / max;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const colors = [
    "var(--color-surface-2)",
    "color-mix(in srgb, var(--color-accent) 25%, var(--color-surface-2))",
    "color-mix(in srgb, var(--color-accent) 50%, var(--color-surface-2))",
    "color-mix(in srgb, var(--color-accent) 75%, var(--color-surface-2))",
    "var(--color-accent)",
  ];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-[3px]" style={{ minWidth: 53 * 13 }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day === null ? (
                <div key={di} className="size-[10px]" />
              ) : (
                <div
                  key={day.key}
                  title={`${day.key}: ${day.minutes} min`}
                  className="size-[10px] rounded-[2px]"
                  style={{ background: colors[level(day.minutes)] }}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
