"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AgentCardProps {
  agent: {
    name: string;
    role?: string;
    group?: string;
    enabled?: boolean;
    weight?: number;
    last_signal?: {
      direction?: string;
      confidence?: number;
      symbol?: string;
    };
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const [enabled, setEnabled] = useState(agent.enabled ?? true);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    // TODO: Call API to update agent status
    console.log(`Agent ${agent.name} ${checked ? "enabled" : "disabled"}`);
  };

  const getSignalIcon = () => {
    if (!agent.last_signal?.direction) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (agent.last_signal.direction.toLowerCase() === "buy") {
      return <TrendingUp className="h-4 w-4 text-accent" />;
    }
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getSignalColor = () => {
    if (!agent.last_signal?.direction) return "text-muted-foreground";
    if (agent.last_signal.direction.toLowerCase() === "buy") {
      return "text-accent";
    }
    return "text-destructive";
  };

  return (
    <Card className="border-border bg-card p-4 shadow-md transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{agent.name}</h3>
          {agent.role && (
            <p className="mt-1 text-sm text-muted-foreground">{agent.role}</p>
          )}
          {agent.group && (
            <Badge variant="outline" className="mt-2 border-primary/40 bg-primary/10 text-foreground text-xs font-medium">
              {agent.group}
            </Badge>
          )}
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {agent.last_signal && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground font-medium">Last Signal</p>
          <div className="mt-2 flex items-center gap-2">
            {getSignalIcon()}
            <span className={`font-semibold ${getSignalColor()}`}>
              {agent.last_signal.direction?.toUpperCase()}
            </span>
            {agent.last_signal.symbol && (
              <span className="text-sm text-foreground font-medium">
                {agent.last_signal.symbol}
              </span>
            )}
          </div>
          {agent.last_signal.confidence !== undefined && (
            <p className="mt-1 text-xs text-muted-foreground">
              Confidence: <span className="font-medium text-foreground">{(agent.last_signal.confidence * 100).toFixed(0)}%</span>
            </p>
          )}
        </div>
      )}

      {agent.weight !== undefined && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            Weight: <span className="font-semibold text-primary">{agent.weight}</span>
          </p>
        </div>
      )}
    </Card>
  );
}
