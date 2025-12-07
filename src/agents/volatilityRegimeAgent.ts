import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC, Candle } from "../core/dataFeed";

function calcATR(candles: Candle[], period = 14): number {
  if (candles.length <= period) return 0;
  let total = 0;
  for (let i = candles.length - period + 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    total += tr;
  }
  return total / period;
}

export class VolatilityRegimeAgent extends TradingAgent {
  constructor() {
    super("volatility-regime", 5 * 60_000, "BTCUSDT", "1h");
  }

  async run(): Promise<AgentRunResult | void> {
    const candles = await getOHLC(this.defaultSymbol, "1h", 150);
    const atr = calcATR(candles, 14);
    const lastClose = candles[candles.length - 1]?.close ?? 0;
    const atrPercent = lastClose ? (atr / lastClose) * 100 : 0;

    let regime = 1;
    if (atrPercent < 0.5) regime = 1;
    else if (atrPercent < 1.5) regime = 2;
    else regime = 3;

    const score = regime === 3 ? 0.1 : 0;
    const confidence = 70;

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence,
      payload: { atr, atrPercent, regime },
    };
  }
}
