import { supabase } from "./supabase";

export type AgentMeta = {
  name: string;
  role: string;
  description: string;
  group_name: string;
  priority: number;
  enabled: boolean;
  meta?: any;
};

export const LOCAL_AGENT_DEFINITIONS: AgentMeta[] = [
  {
    name: "market-structure",
    role: "Market Structure Agent",
    description:
      "Analyzes trend, structure, BOS/CHOCH, and overall direction bias.",
    group_name: "technical",
    priority: 10,
    enabled: true,
    meta: { timeframes: ["1h", "4h"] },
  },
  {
    name: "order-flow",
    role: "Order Flow Agent",
    description:
      "Monitors volume and possible whale activity using volume shifts.",
    group_name: "technical",
    priority: 9,
    enabled: true,
  },
  {
    name: "momentum",
    role: "Momentum Agent",
    description:
      "Uses RSI/oscillators to detect overbought/oversold momentum.",
    group_name: "technical",
    priority: 8,
    enabled: true,
  },
  {
    name: "volatility-regime",
    role: "Volatility & Regime Agent",
    description: "Detects volatility environment (mean-reversion vs trend).",
    group_name: "regime",
    priority: 7,
    enabled: true,
  },
  {
    name: "news-sentiment",
    role: "News & Sentiment Agent",
    description:
      "Analyzes crypto news using LLM to generate sentiment score.",
    group_name: "sentiment",
    priority: 9,
    enabled: true,
  },
  {
    name: "multi-timeframe",
    role: "Multi-Timeframe Agent",
    description:
      "Aggregates signals from multiple timeframes for alignment.",
    group_name: "technical",
    priority: 8,
    enabled: true,
  },
  {
    name: "pattern-recognition",
    role: "Pattern Recognition Agent",
    description:
      "Detects basic price patterns: double top/bottom, flags, triangles.",
    group_name: "pattern",
    priority: 7,
    enabled: true,
  },
  {
    name: "statistical-edge",
    role: "Statistical Edge Agent",
    description:
      "Estimates probability of bullish/bearish move based on history.",
    group_name: "quant",
    priority: 8,
    enabled: true,
  },
  {
    name: "risk-manager",
    role: "Risk Manager Agent",
    description:
      "Controls position size, leverage, and account risk exposure.",
    group_name: "risk",
    priority: 10,
    enabled: true,
  },
  {
    name: "decision-agent",
    role: "Decision Fusion Agent",
    description:
      "Weights all other agents and generates final trade decisions.",
    group_name: "orchestrator",
    priority: 100,
    enabled: true,
  },
];

export async function syncAgentRegistry() {
  for (const agent of LOCAL_AGENT_DEFINITIONS) {
    const { error } = await supabase.from("agents").upsert(
      {
        name: agent.name,
        role: agent.role,
        description: agent.description,
        group_name: agent.group_name,
        priority: agent.priority,
        enabled: agent.enabled,
        meta: agent.meta ?? null,
      },
      { onConflict: "name" }
    );

    if (error) {
      console.error(`Failed to sync agent ${agent.name}:`, error.message);
    }
  }
  console.log("✅ Agent registry synced to Supabase");
}
