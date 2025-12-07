/**
 * Order Flow Agent Service
 * 
 * Microservice version of OrderFlowAgent
 * Port: 5002
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class OrderFlowService extends AgentServiceBase {
  constructor() {
    super("order-flow", 5002);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    let candles = marketData?.ohlc_15m ?? [];
    
    if (!candles || candles.length === 0) {
      candles = await getOHLC(symbol, "15m", 100);
    }

    if (!candles || candles.length < 10) {
      return { score: 0, confidence: 0, payload: { error: "Insufficient data" } };
    }

    // Volume analysis
    const recentCandles = candles.slice(-20);
    const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
    const lastCandle = recentCandles[recentCandles.length - 1];
    
    const volumeRatio = lastCandle.volume / avgVolume;
    const bodySize = Math.abs(lastCandle.close - lastCandle.open);
    const range = lastCandle.high - lastCandle.low;
    const bodyRatio = range > 0 ? bodySize / range : 0;

    let score = 0;
    let flow = "neutral";

    if (volumeRatio > 1.5 && lastCandle.close > lastCandle.open && bodyRatio > 0.6) {
      flow = "buying";
      score = Math.min(0.7, volumeRatio * 0.3);
    } else if (volumeRatio > 1.5 && lastCandle.close < lastCandle.open && bodyRatio > 0.6) {
      flow = "selling";
      score = -Math.min(0.7, volumeRatio * 0.3);
    }

    return {
      score,
      confidence: Math.min(80, volumeRatio * 30),
      payload: {
        flow,
        volumeRatio: volumeRatio.toFixed(2),
        bodyRatio: bodyRatio.toFixed(2)
      }
    };
  }
}

const service = new OrderFlowService();
service.start().catch(err => {
  console.error("Failed to start order-flow service:", err);
  process.exit(1);
});
