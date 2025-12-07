import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { getOHLC } from "../core/dataFeed";

export class PatternRecognitionAgent extends TradingAgent {
  constructor() {
    super("pattern-recognition", 4 * 60_000, "BTCUSDT", "1h");
  }

  async run(): Promise<AgentRunResult | void> {
    const candles = await getOHLC(this.defaultSymbol, "1h", 80);
    const closes = candles.map(c => c.close);
    if (closes.length < 10) return;

    const last = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const p3 = closes[closes.length - 3];
    const p4 = closes[closes.length - 4];

    let pattern = "none";
    let score = 0;

    // Tiny example: local double bottom / double top
    if (Math.abs(p3 - p1(closes, -5)) < last * 0.005 && last > prev) {
      pattern = "double-bottom-like";
      score = 0.5;
    } else if (Math.abs(p3 - p1(closes, -5)) < last * 0.005 && last < prev) {
      pattern = "double-top-like";
      score = -0.5;
    } else if (last > prev && prev > p3 && p3 > p4) {
      pattern = "small-up-channel";
      score = 0.3;
    } else if (last < prev && prev < p3 && p3 < p4) {
      pattern = "small-down-channel";
      score = -0.3;
    }

    const confidence = pattern === "none" ? 40 : 70;

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence,
      payload: { pattern, last, prev, p3, p4 },
    };
  }
}

function p1(arr: number[], offsetFromEnd: number) {
  const idx = arr.length + offsetFromEnd;
  return arr[Math.max(0, Math.min(arr.length - 1, idx))];
}
