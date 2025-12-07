/**
 * Momentum Agent Service
 * 
 * Microservice version of MomentumAgent
 * Port: 5003
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class MomentumService extends AgentServiceBase {
  constructor() {
    super("momentum", 5003);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    let candles = marketData?.ohlc_1h ?? [];
    
    if (!candles || candles.length === 0) {
      candles = await getOHLC(symbol, "1h", 50);
    }

    if (!candles || candles.length < 14) {
      return { score: 0, confidence: 0, payload: { error: "Insufficient data" } };
    }

    // Simple RSI calculation
    const closes = candles.slice(-15).map(c => c.close);
    const changes = [];
    
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }

    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);

    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let score = 0;
    let signal = "neutral";

    if (rsi > 70) {
      signal = "overbought";
      score = -0.5;
    } else if (rsi < 30) {
      signal = "oversold";
      score = 0.5;
    } else if (rsi > 50) {
      score = ((rsi - 50) / 50) * 0.3;
    } else {
      score = ((rsi - 50) / 50) * 0.3;
    }

    return {
      score,
      confidence: Math.abs(rsi - 50) * 1.5,
      payload: {
        rsi: rsi.toFixed(2),
        signal
      }
    };
  }
}

const service = new MomentumService();
service.start().catch(err => {
  console.error("Failed to start momentum service:", err);
  process.exit(1);
});
