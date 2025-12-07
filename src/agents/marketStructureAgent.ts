import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC } from "../core/dataFeed";

export class MarketStructureAgent extends TradingAgent {
  constructor() {
    super("market-structure", 5 * 60_000, "BTCUSDT", "1h");
  }

  async run(): Promise<AgentRunResult | void> {
    const candles = await getOHLC(this.defaultSymbol, "1h", 150);
    if (candles.length < 50) return;

    const closes = candles.map(c => c.close);
    const last = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const older = closes[closes.length - 10];

    let score = 0;
    let trend: "bullish" | "bearish" | "neutral" = "neutral";

    if (last > prev && last > older) {
      trend = "bullish";
      score = 0.7;
    } else if (last < prev && last < older) {
      trend = "bearish";
      score = -0.7;
    }

    const confidence = trend === "neutral" ? 40 : 75;

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence,
      payload: { trend, last, prev, older },
    };
  }
}
