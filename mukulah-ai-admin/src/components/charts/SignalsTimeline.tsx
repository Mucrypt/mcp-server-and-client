"use client";

import { TradeSignal } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function SignalsTimeline({ signals }: { signals: TradeSignal[] }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-xs font-medium text-slate-300">
        Recent Trade Signals
      </div>
      <div className="space-y-2 text-xs">
        {signals.map(sig => (
          <div
            key={sig.id}
            className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/70 px-2 py-1.5"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-300">
                  {sig.symbol} {sig.timeframe}
                </span>
                <Badge
                  className={
                    sig.direction === "buy"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : sig.direction === "sell"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-slate-500/20 text-slate-200"
                  }
                >
                  {sig.direction.toUpperCase()}
                </Badge>
              </div>
              <div className="text-[10px] text-slate-500">
                by {sig.created_by_agent} ·{" "}
                {new Date(sig.created_at).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <div>Lev {sig.leverage}x</div>
              <div>Conf {sig.confidence.toFixed(1)}%</div>
            </div>
          </div>
        ))}
        {!signals.length && (
          <div className="text-[11px] text-slate-500">
            No trade signals yet.
          </div>
        )}
      </div>
    </div>
  );
}
