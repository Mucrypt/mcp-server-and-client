"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Sparkles, Shield, Zap, CheckCircle2 } from "lucide-react";

const STRATEGY_PROFILES = [
  {
    id: "conservative",
    name: "Conservative",
    description: "Lower risk, higher confidence thresholds. Focus on quality over quantity.",
    icon: Shield,
    color: "emerald",
    settings: {
      riskPerTrade: 0.5,
      leverageCap: 3,
      confidenceThreshold: 0.75,
      agents: {
        "risk-manager": 2.0,
        "market-structure": 1.2,
        "volatility-regime": 1.3,
      },
    },
  },
  {
    id: "normal",
    name: "Normal",
    description: "Balanced risk-reward profile. Recommended for most market conditions.",
    icon: Sparkles,
    color: "sky",
    settings: {
      riskPerTrade: 1.0,
      leverageCap: 5,
      confidenceThreshold: 0.65,
      agents: {
        "risk-manager": 1.5,
        "market-structure": 1.0,
        "order-flow": 1.0,
        "momentum": 1.0,
      },
    },
  },
  {
    id: "aggressive",
    name: "Aggressive",
    description: "Higher risk tolerance. Exploit more signals and market opportunities.",
    icon: Zap,
    color: "orange",
    settings: {
      riskPerTrade: 2.0,
      leverageCap: 10,
      confidenceThreshold: 0.55,
      agents: {
        "momentum": 1.5,
        "order-flow": 1.3,
        "pattern-recognition": 1.2,
      },
    },
  },
];

export default function LabPage() {
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const handleActivateProfile = async (profileId: string) => {
    setActivating(true);
    try {
      await api.activateProfile(profileId);
      setActiveProfile(profileId);
      console.log(`Activated ${profileId} profile`);
    } catch (error) {
      console.error("Failed to activate profile:", error);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Strategy Lab</h1>
        <p className="mt-2 text-muted-foreground">
          Experiment with different trading strategies and risk profiles
        </p>
      </div>

      {activeProfile && (
        <Card className="border-accent bg-accent/10 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold text-foreground">
                Active Profile: {STRATEGY_PROFILES.find(p => p.id === activeProfile)?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Strategy is currently active and influencing agent behavior
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {STRATEGY_PROFILES.map((profile) => {
          const Icon = profile.icon;
          const isActive = activeProfile === profile.id;

          return (
            <Card
              key={profile.id}
              className={`border-border bg-card p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-primary/20" : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <Icon className={`h-8 w-8 ${
                  profile.id === 'conservative' ? 'text-accent' : 
                  profile.id === 'aggressive' ? 'text-primary' : 
                  'text-primary'
                } drop-shadow-lg`} />
                {isActive && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>

              <h3 className="text-xl font-bold text-foreground">
                {profile.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{profile.description}</p>

              <div className="mt-6 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="text-sm font-semibold text-foreground">Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk per Trade:</span>
                    <span className="font-semibold text-foreground">
                      {profile.settings.riskPerTrade}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Leverage:</span>
                    <span className="font-semibold text-foreground">
                      {profile.settings.leverageCap}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence Threshold:</span>
                    <span className="font-semibold text-foreground">
                      {(profile.settings.confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="text-sm font-semibold text-foreground">Agent Weights</h4>
                <div className="space-y-1">
                  {Object.entries(profile.settings.agents).map(([agent, weight]) => (
                    <div key={agent} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{agent}</span>
                      <Badge variant="outline" className="border-border">
                        {weight}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleActivateProfile(profile.id)}
                disabled={activating || isActive}
                className="mt-6 w-full"
                variant={isActive ? "outline" : "default"}
              >
                {isActive ? "Currently Active" : "Activate Profile"}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Custom Strategy Builder
        </h2>
        <p className="text-sm text-muted-foreground">
          Coming soon: Build and test your own custom strategy profiles with fine-grained
          control over agent weights, risk parameters, and market conditions.
        </p>
      </Card>
    </div>
  );
}
