/**
 * Market Structure Agent Service
 * 
 * Microservice version of MarketStructureAgent
 * Port: 5001
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class MarketStructureService extends AgentServiceBase {
  constructor() {
    super("market-structure", 5001);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    // Use cached data if available, otherwise fetch
    let candles = marketData?.ohlc_1h ?? [];
    
    if (!candles || candles.length === 0) {
      candles = await getOHLC(symbol, "1h", 100);
    }

    if (!candles || candles.length < 20) {
      return { score: 0, confidence: 0, payload: { error: "Insufficient data" } };
    }

    // Simple trend detection: compare recent price to MA
    const closes = candles.slice(-50).map(c => c.close);
    const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const ma50 = closes.reduce((a, b) => a + b, 0) / 50;
    const currentPrice = closes[closes.length - 1];

    let trend = "sideways";
    let score = 0;

    if (ma20 > ma50 * 1.01 && currentPrice > ma20) {
      trend = "uptrend";
      score = 0.6;
    } else if (ma20 < ma50 * 0.99 && currentPrice < ma20) {
      trend = "downtrend";
      score = -0.6;
    }

    const confidence = Math.abs(((ma20 - ma50) / ma50) * 1000);

    return {
      score,
      confidence: Math.min(85, confidence),
      payload: {
        trend,
        ma20,
        ma50,
        currentPrice
      }
    };
  }
}

// Start service
const service = new MarketStructureService();
service.start().catch(err => {
  console.error("Failed to start market-structure service:", err);
  process.exit(1);
});
