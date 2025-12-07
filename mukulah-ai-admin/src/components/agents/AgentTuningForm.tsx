"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import { Sparkles } from "lucide-react";

interface AgentTuningFormProps {
  agents: any[];
}

const STRATEGY_PROFILES = {
  conservative: {
    name: "Conservative",
    description: "Lower risk, higher confidence thresholds",
    weights: {
      "risk-manager": 2.0,
      "market-structure": 1.2,
      "volatility-regime": 1.3,
    },
    riskPerTrade: 0.5,
    leverageCap: 3,
  },
  normal: {
    name: "Normal",
    description: "Balanced risk-reward profile",
    weights: {
      "risk-manager": 1.5,
      "market-structure": 1.0,
      "order-flow": 1.0,
      "momentum": 1.0,
    },
    riskPerTrade: 1.0,
    leverageCap: 5,
  },
  aggressive: {
    name: "Aggressive",
    description: "Higher risk, exploit more signals",
    weights: {
      "momentum": 1.5,
      "order-flow": 1.3,
      "pattern-recognition": 1.2,
    },
    riskPerTrade: 2.0,
    leverageCap: 10,
  },
};

export function AgentTuningForm({ agents }: AgentTuningFormProps) {
  const [weights, setWeights] = useState<Record<string, number>>(
    agents.reduce((acc, agent) => {
      acc[agent.name] = agent.weight || 1.0;
      return acc;
    }, {} as Record<string, number>)
  );
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  const handleWeightChange = (agentName: string, value: number[]) => {
    setWeights((prev) => ({
      ...prev,
      [agentName]: value[0],
    }));
  };

  const handleProfileActivate = async (profileKey: string) => {
    const profile = STRATEGY_PROFILES[profileKey as keyof typeof STRATEGY_PROFILES];
    
    // Update weights based on profile
    const newWeights = { ...weights };
    Object.entries(profile.weights).forEach(([name, weight]) => {
      if (newWeights[name] !== undefined) {
        newWeights[name] = weight;
      }
    });
    
    setWeights(newWeights);
    setActiveProfile(profileKey);

    try {
      await api.activateProfile(profileKey);
      console.log(`Activated ${profile.name} profile`);
    } catch (error) {
      console.error("Failed to activate profile:", error);
    }
  };

  const handleSaveWeights = async () => {
    try {
      for (const [name, weight] of Object.entries(weights)) {
        await api.updateAgentConfig(name, { weight });
      }
      console.log("Weights saved successfully");
    } catch (error) {
      console.error("Failed to save weights:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Strategy Profiles */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">
          Strategy Profiles
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(STRATEGY_PROFILES).map(([key, profile]) => (
            <div
              key={key}
              className={`rounded-lg border p-4 transition-all ${
                activeProfile === key
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-slate-800 bg-slate-950/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h4 className="font-medium text-slate-200">{profile.name}</h4>
              </div>
              <p className="mt-2 text-sm text-slate-400">{profile.description}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>Risk/Trade: {profile.riskPerTrade}%</p>
                <p>Max Leverage: {profile.leverageCap}x</p>
              </div>
              <Button
                onClick={() => handleProfileActivate(key)}
                variant={activeProfile === key ? "default" : "outline"}
                className="mt-4 w-full"
                size="sm"
              >
                {activeProfile === key ? "Active" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Agent Weights */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">
          Individual Agent Weights
        </h3>
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">{agent.name}</p>
                  {agent.role && (
                    <p className="text-sm text-slate-400">{agent.role}</p>
                  )}
                </div>
                <Badge variant="outline" className="border-slate-700">
                  {weights[agent.name]?.toFixed(1) || "1.0"}
                </Badge>
              </div>
              <div className="mt-3">
                <Slider
                  value={[weights[agent.name] || 1.0]}
                  onValueChange={(value: number[]) => handleWeightChange(agent.name, value)}
                  min={0}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>0.0</span>
                  <span>3.0</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSaveWeights} className="w-full">
        Save Configuration
      </Button>
    </div>
  );
}
