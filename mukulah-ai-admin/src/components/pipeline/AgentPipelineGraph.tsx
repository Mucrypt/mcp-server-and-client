"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Badge } from "@/components/ui/badge";

type Props = {
  agents?: any[];
  latestRun?: any;
  pipelineRun?: any;
};

export function AgentPipelineGraph({ agents, latestRun, pipelineRun }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const run = pipelineRun || latestRun;

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(".pipeline-node", {
        opacity: 0,
        x: -20,
        stagger: 0.08,
        duration: 0.4,
        ease: "power2.out",
      }).from(
        ".pipeline-connector",
        {
          scaleX: 0,
          transformOrigin: "left center",
          stagger: 0.06,
          duration: 0.3,
        },
        "-=0.3"
      );
    }, containerRef);
    return () => ctx.revert();
  }, [run]);

  const stages = [
    "market-structure",
    "order-flow",
    "momentum",
    "volatility-regime",
    "news-sentiment",
    "multi-timeframe",
    "pattern-recognition",
    "statistical-edge",
    "risk-manager",
    "decision-agent",
  ];

  const stepsByAgent =
    run?.steps?.reduce((acc: Record<string, any>, step: any) => {
      acc[step.agent_name] = step;
      return acc;
    }, {} as Record<string, any>) ?? 
    run?.agent_results?.reduce((acc: Record<string, any>, result: any) => {
      acc[result.agent_name] = result;
      return acc;
    }, {} as Record<string, any>) ?? {};

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium text-slate-300">
          Agent Pipeline Chain
        </div>
        {run && (
          <div className="text-[10px] text-slate-500">
            {new Date(run.created_at).toLocaleTimeString()} –{" "}
            <span
              className={
                run.status === "completed"
                  ? "text-emerald-300"
                  : run.status === "running"
                  ? "text-sky-300"
                  : "text-red-300"
              }
            >
              {run.status}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {stages.map((name, idx) => {
          const meta = agents?.find((a: any) => a.name === name);
          const step = stepsByAgent[name];
          const isLast = idx === stages.length - 1;

          const color =
            name === "decision-agent"
              ? "from-emerald-500/80 to-sky-500/80"
              : "from-slate-800 to-slate-900";

          return (
            <div key={name} className="flex items-center gap-3">
              <div
                className={`pipeline-node flex flex-1 items-center justify-between rounded-xl border border-slate-800 bg-gradient-to-r ${color} px-3 py-2`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-50">
                      {meta?.role ?? name}
                    </span>
                    {step && step.signal && (
                      <Badge
                        variant={step.signal.direction === "buy" ? "default" : "destructive"}
                        className="text-[9px]"
                      >
                        {step.signal.direction?.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {step && (
                    <div className="mt-1 text-[10px] text-emerald-100/90">
                      {step.score !== undefined && `score ${step.score.toFixed(2)} · `}
                      {step.confidence !== undefined && `conf ${(step.confidence * 100).toFixed(0)}%`}
                    </div>
                  )}
                </div>
                <div className="text-right text-[10px] text-slate-200/80">
                  {step?.duration_ms ? (
                    <div>{step.duration_ms}ms</div>
                  ) : step?.started_at ? (
                    <>
                      <div>
                        {new Date(step.started_at).toLocaleTimeString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400/70">waiting...</div>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className="pipeline-connector h-[2px] w-8 shrink-0 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
