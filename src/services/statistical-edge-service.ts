/**
 * Statistical Edge Agent Service
 * 
 * Microservice version of StatisticalEdgeAgent
 * Port: 5008
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class StatisticalEdgeService extends AgentServiceBase {
  constructor() {
    super("statistical-edge", 5008);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    let candles = marketData?.ohlc_1h ?? [];
    
    if (!candles || candles.length === 0) {
      candles = await getOHLC(symbol, "1h", 100);
    }

    if (!candles || candles.length < 50) {
      return { score: 0, confidence: 0, payload: { error: "Insufficient data" } };
    }

    // Mean reversion: check if price is far from average
    const closes = candles.slice(-50).map(c => c.close);
    const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
    
    const variance = closes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / closes.length;
    const stdDev = Math.sqrt(variance);
    
    const currentPrice = closes[closes.length - 1];
    const zScore = (currentPrice - mean) / stdDev;

    let score = 0;
    let edge = "neutral";

    if (zScore < -1.5) {
      edge = "oversold-reversion";
      score = 0.5;
    } else if (zScore > 1.5) {
      edge = "overbought-reversion";
      score = -0.5;
    }

    return {
      score,
      confidence: Math.min(75, Math.abs(zScore) * 30),
      payload: {
        edge,
        zScore: zScore.toFixed(2),
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        currentPrice: currentPrice.toFixed(2)
      }
    };
  }
}

const service = new StatisticalEdgeService();
service.start().catch(err => {
  console.error("Failed to start statistical-edge service:", err);
  process.exit(1);
});
