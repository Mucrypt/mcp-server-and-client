"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { gsap } from "gsap";

interface HealthStatus {
  status: string;
  mode?: string;
  httpAgents?: boolean;
}

export function Topbar() {
  const [health, setHealth] = useState<HealthStatus>({ status: "checking" });
  const topbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // GSAP fade-in animation with scale
    if (topbarRef.current) {
      gsap.fromTo(
        topbarRef.current,
        { opacity: 0, y: -20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    // Fetch health status
    const fetchHealth = async () => {
      try {
        const res = await api.health();
        setHealth({
          status: res.status || "ok",
          mode: process.env.NEXT_PUBLIC_AGENT_MODE || "pipeline",
          httpAgents: process.env.NEXT_PUBLIC_USE_HTTP_AGENTS === "true",
        });
      } catch {
        setHealth({ status: "down" });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);

    return () => clearInterval(interval);
  }, []);

  const statusBadgeVariant =
    health.status === "ok"
      ? "default"
      : health.status === "checking"
      ? "secondary"
      : "destructive";

  return (
    <header
      ref={topbarRef}
      className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-xl shadow-sm"
    >
      <div className="flex items-center gap-4">
        <h2 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-lg font-bold text-transparent">
          Trading Control Center
        </h2>
        <Badge variant={statusBadgeVariant} className="gap-1.5 transition-all duration-300">
          <div className={`h-2 w-2 rounded-full ${health.status === "ok" ? "bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-destructive"}`} />
          Engine {health.status}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {health.mode && (
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-foreground font-medium">
            Mode: {health.mode}
          </Badge>
        )}
        {health.httpAgents !== undefined && (
          <Badge variant="outline" className="border-accent/30 bg-accent/5 text-foreground font-medium">
            {health.httpAgents ? "Microservices" : "Monolithic"}
          </Badge>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
