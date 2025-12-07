"use client";

import { useMemo } from "react";

type Point = { x: number; y: number };

export function AccountEquityChart({ history }: { history: number[] }) {
  const points: Point[] = useMemo(() => {
    if (!history.length) return [];
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;

    return history.map((value, idx) => {
      const x = (idx / (history.length - 1 || 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return { x, y };
    });
  }, [history]);

  return (
    <div className="h-40 w-full rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 p-3">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            className="text-emerald-400"
            points={points.map(p => `${p.x},${p.y}`).join(" ")}
          />
        )}
      </svg>
    </div>
  );
}
