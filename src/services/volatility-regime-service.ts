/**
 * Volatility Regime Agent Service
 * 
 * Microservice version of VolatilityRegimeAgent
 * Port: 5004
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class VolatilityRegimeService extends AgentServiceBase {
  constructor() {
    super("volatility-regime", 5004);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    let candles = marketData?.ohlc_4h ?? [];
    
    if (!candles || candles.length === 0) {
      candles = await getOHLC(symbol, "4h", 50);
    }

    if (!candles || candles.length < 20) {
      return { score: 0, confidence: 50, payload: { regime: 2 } };
    }

    // Calculate ATR (Average True Range)
    const recent = candles.slice(-20);
    const ranges = recent.map(c => c.high - c.low);
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    
    const currentRange = recent[recent.length - 1].high - recent[recent.length - 1].low;
    const volatilityRatio = currentRange / avgRange;

    let regime = 2; // 1=calm, 2=normal, 3=high
    let score = 0;

    if (volatilityRatio < 0.7) {
      regime = 1;
      score = 0.3; // Low volatility = safer to trade
    } else if (volatilityRatio > 1.5) {
      regime = 3;
      score = -0.4; // High volatility = risky
    }

    return {
      score,
      confidence: 70,
      payload: {
        regime,
        volatilityRatio: volatilityRatio.toFixed(2),
        avgRange: avgRange.toFixed(2),
        currentRange: currentRange.toFixed(2)
      }
    };
  }
}

const service = new VolatilityRegimeService();
service.start().catch(err => {
  console.error("Failed to start volatility-regime service:", err);
  process.exit(1);
});
