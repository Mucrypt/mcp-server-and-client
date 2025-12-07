import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC } from "../core/dataFeed";

function calcRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  let gain = 0;
  let loss = 0;

  for (let i = closes.length - period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export class MomentumAgent extends TradingAgent {
  constructor() {
    super("momentum", 60_000, "BTCUSDT", "15m");
  }

  async run(): Promise<AgentRunResult | void> {
    const candles = await getOHLC(this.defaultSymbol, "15m", 100);
    const closes = candles.map(c => c.close);
    const rsi = calcRSI(closes);

    let score = 0;
    let confidence = 40;

    if (rsi > 70) {
      score = -0.8;
      confidence = 80;
    } else if (rsi < 30) {
      score = 0.8;
      confidence = 80;
    } else if (rsi > 60) {
      score = -0.3;
      confidence = 60;
    } else if (rsi < 40) {
      score = 0.3;
      confidence = 60;
    }

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence,
      payload: { rsi },
    };
  }
}
