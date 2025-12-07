import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC } from "../core/dataFeed";

export class OrderFlowAgent extends TradingAgent {
  constructor() {
    super("order-flow", 2 * 60_000, "BTCUSDT", "15m");
  }

  async run(): Promise<AgentRunResult | void> {
    const candles = await getOHLC(this.defaultSymbol, "15m", 80);
    if (candles.length < 20) return;

    const recent = candles.slice(-20);
    const firstHalf = recent.slice(0, 10);
    const secondHalf = recent.slice(10);

    const vol1 = firstHalf.reduce((s, c) => s + c.volume, 0);
    const vol2 = secondHalf.reduce((s, c) => s + c.volume, 0);

    const avgClose1 =
      firstHalf.reduce((s, c) => s + c.close, 0) / firstHalf.length;
    const avgClose2 =
      secondHalf.reduce((s, c) => s + c.close, 0) / secondHalf.length;

    let score = 0;
    let liquidityBias: "buy" | "sell" | "neutral" = "neutral";

    if (vol2 > vol1 * 1.3 && avgClose2 > avgClose1) {
      liquidityBias = "buy";
      score = 0.6;
    } else if (vol2 > vol1 * 1.3 && avgClose2 < avgClose1) {
      liquidityBias = "sell";
      score = -0.6;
    }

    const ratio = vol1 > 0 ? vol2 / vol1 : 1;
    const confidence = Math.max(30, Math.min(90, (ratio - 1) * 100));

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence: isFinite(confidence) ? confidence : 40,
      payload: { vol1, vol2, avgClose1, avgClose2, liquidityBias },
    };
  }
}
