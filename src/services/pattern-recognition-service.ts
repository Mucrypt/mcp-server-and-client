/**
 * Pattern Recognition Agent Service
 * 
 * Microservice version of PatternRecognitionAgent
 * Port: 5007
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class PatternRecognitionService extends AgentServiceBase {
  constructor() {
    super("pattern-recognition", 5007);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    let candles = marketData?.ohlc_1h ?? [];
    
    if (!candles || candles.length === 0) {
      candles = await getOHLC(symbol, "1h", 50);
    }

    if (!candles || candles.length < 10) {
      return { score: 0, confidence: 0, payload: { error: "Insufficient data" } };
    }

    const recent = candles.slice(-5);
    
    // Simple pattern: higher highs & higher lows = bullish
    let higherHighs = 0;
    let higherLows = 0;
    let lowerHighs = 0;
    let lowerLows = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].high > recent[i - 1].high) higherHighs++;
      if (recent[i].low > recent[i - 1].low) higherLows++;
      if (recent[i].high < recent[i - 1].high) lowerHighs++;
      if (recent[i].low < recent[i - 1].low) lowerLows++;
    }

    let pattern = "none";
    let score = 0;

    if (higherHighs >= 3 && higherLows >= 3) {
      pattern = "bullish-continuation";
      score = 0.6;
    } else if (lowerHighs >= 3 && lowerLows >= 3) {
      pattern = "bearish-continuation";
      score = -0.6;
    }

    return {
      score,
      confidence: pattern !== "none" ? 65 : 30,
      payload: {
        pattern,
        higherHighs,
        higherLows,
        lowerHighs,
        lowerLows
      }
    };
  }
}

const service = new PatternRecognitionService();
service.start().catch(err => {
  console.error("Failed to start pattern-recognition service:", err);
  process.exit(1);
});
