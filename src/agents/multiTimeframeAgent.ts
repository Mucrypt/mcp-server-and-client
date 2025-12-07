import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC } from "../core/dataFeed";

export class MultiTimeframeAgent extends TradingAgent {
  constructor() {
    super("multi-timeframe", 3 * 60_000, "BTCUSDT", "1h");
  }

  async run(): Promise<AgentRunResult | void> {
    const timeframes = ["5m", "15m", "1h", "4h", "1d"];
    let bullish = 0;
    let bearish = 0;

    for (const tf of timeframes) {
      const candles = await getOHLC(this.defaultSymbol, tf, 60);
      if (candles.length < 20) continue;

      const last = candles[candles.length - 1].close;
      const older = candles[candles.length - 20].close;

      if (last > older * 1.01) bullish++;
      else if (last < older * 0.99) bearish++;
    }

    let score = 0;
    if (bullish > bearish) score = 0.5 * (bullish / timeframes.length);
    else if (bearish > bullish) score = -0.5 * (bearish / timeframes.length);

    const confidence = 60 + 5 * Math.abs(bullish - bearish);

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence: Math.max(40, Math.min(95, confidence)),
      payload: { bullish, bearish, timeframes },
    };
  }
}
