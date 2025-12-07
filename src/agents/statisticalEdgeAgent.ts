import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC } from "../core/dataFeed";

export class StatisticalEdgeAgent extends TradingAgent {
  constructor() {
    super("statistical-edge", 6 * 60_000, "BTCUSDT", "1h");
  }

  async run(): Promise<AgentRunResult | void> {
    const candles = await getOHLC(this.defaultSymbol, "1h", 300);
    if (candles.length < 60) return;

    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      const r =
        (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
      returns.push(r);
    }

    const last10 = returns.slice(-10);
    const avgLast10 =
      last10.reduce((s, r) => s + r, 0) / Math.max(1, last10.length);

    const upMoves = returns.filter(r => r > 0).length;
    const probUp = upMoves / returns.length;

    let score = 0;
    if (avgLast10 > 0 && probUp > 0.52) score = 0.4;
    else if (avgLast10 < 0 && probUp < 0.48) score = -0.4;

    const confidence = Math.max(
      40,
      Math.min(90, 100 * Math.abs(probUp - 0.5) * 2)
    );

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence,
      payload: { avgLast10, probUp },
    };
  }
}
