import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { supabase } from "../core/supabase";
import { enqueueExecution } from "../execution/executionQueue"; // 👈 NEW

export class DecisionAgent extends TradingAgent {
  accountId: string;

  constructor(accountId: string) {
    super("decision-agent", 3 * 60_000, "BTCUSDT", "1h");
    this.accountId = accountId;
  }

  async run(): Promise<AgentRunResult | void> {
    const { data, error } = await supabase
      .from("agent_signals")
      .select("*")
      .eq("account_id", this.accountId)
      .eq("symbol", this.defaultSymbol)
      .gte(
        "created_at",
        new Date(Date.now() - 10 * 60_000).toISOString()
      );

    if (error) {
      console.error("DecisionAgent: failed to load agent_signals", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log("DecisionAgent: no signals to analyze.");
      return;
    }

    const weights: Record<string, number> = {
      "market-structure": 1.5,
      "order-flow": 1.2,
      "momentum": 1.2,
      "volatility-regime": 0.8,
      "news-sentiment": 1.5,
      "multi-timeframe": 1.3,
      "pattern-recognition": 1.0,
      "statistical-edge": 1.3,
      "risk-manager": 2.0,
    };

    let weightedSum = 0;
    let weightTotal = 0;

    for (const row of data) {
      const w = weights[row.agent_name] ?? 1.0;
      const score = Number(row.score ?? 0);
      const conf = Number(row.confidence ?? 50) / 100;
      const eff = w * conf;
      weightedSum += score * eff;
      weightTotal += eff;
    }

    if (weightTotal === 0) return;

    const finalScore = weightedSum / weightTotal;

    let direction: "buy" | "sell" | "hold" = "hold";
    if (finalScore > 0.25) direction = "buy";
    else if (finalScore < -0.25) direction = "sell";

    const confidence = Math.min(99, Math.abs(finalScore) * 100);

    // Insert and get ID
    const { data: inserted, error: insertError } = await supabase
      .from("trade_signals")
      .insert([
        {
          account_id: this.accountId,
          symbol: this.defaultSymbol,
          timeframe: this.defaultTimeframe,
          direction,
          leverage: direction === "hold" ? 0 : 3,
          confidence,
          created_by_agent: this.name,
        },
      ])
      .select("id")
      .maybeSingle();

    if (insertError || !inserted) {
      console.error(
        "DecisionAgent: failed to insert trade_signal",
        insertError?.message
      );
    } else {
      const signalId = inserted.id as string;
      console.log(
        `💡 DecisionAgent: ${direction.toUpperCase()} (score=${finalScore.toFixed(
          2
        )}, conf=${confidence.toFixed(1)}%) => signal ${signalId}`
      );

      if (direction !== "hold") {
        // Enqueue for execution
        await enqueueExecution(signalId);
      }
    }

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score: finalScore,
      confidence,
      payload: { direction, signalsCount: data.length },
    };
  }
}
