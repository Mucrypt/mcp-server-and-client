/**
 * Multi-Timeframe Agent Service
 * 
 * Microservice version of MultiTimeframeAgent
 * Port: 5006
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { getOHLC } from "../core/dataFeed.js";

class MultiTimeframeService extends AgentServiceBase {
  constructor() {
    super("multi-timeframe", 5006);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { symbol, marketData } = context;

    // Get multiple timeframes
    const [tf15m, tf1h, tf4h] = await Promise.all([
      marketData?.ohlc_15m?.length ? marketData.ohlc_15m : getOHLC(symbol, "15m", 50),
      marketData?.ohlc_1h?.length ? marketData.ohlc_1h : getOHLC(symbol, "1h", 50),
      marketData?.ohlc_4h?.length ? marketData.ohlc_4h : getOHLC(symbol, "4h", 30),
    ]);

    if (!tf15m.length || !tf1h.length || !tf4h.length) {
      return { score: 0, confidence: 0, payload: { error: "Insufficient data" } };
    }

    // Simple trend alignment check
    const trend15m = this.getTrend(tf15m);
    const trend1h = this.getTrend(tf1h);
    const trend4h = this.getTrend(tf4h);

    let score = 0;
    let alignment = "mixed";

    if (trend15m > 0 && trend1h > 0 && trend4h > 0) {
      alignment = "bullish-aligned";
      score = 0.7;
    } else if (trend15m < 0 && trend1h < 0 && trend4h < 0) {
      alignment = "bearish-aligned";
      score = -0.7;
    } else if (trend1h > 0 && trend4h > 0) {
      alignment = "bullish-partial";
      score = 0.4;
    } else if (trend1h < 0 && trend4h < 0) {
      alignment = "bearish-partial";
      score = -0.4;
    }

    const confidence = alignment.includes("aligned") ? 80 : 50;

    return {
      score,
      confidence,
      payload: {
        alignment,
        trends: {
          "15m": trend15m > 0 ? "up" : trend15m < 0 ? "down" : "neutral",
          "1h": trend1h > 0 ? "up" : trend1h < 0 ? "down" : "neutral",
          "4h": trend4h > 0 ? "up" : trend4h < 0 ? "down" : "neutral"
        }
      }
    };
  }

  private getTrend(candles: any[]): number {
    if (candles.length < 10) return 0;
    
    const recent = candles.slice(-10);
    const first = recent[0].close;
    const last = recent[recent.length - 1].close;
    
    const change = (last - first) / first;
    
    if (change > 0.01) return 1;
    if (change < -0.01) return -1;
    return 0;
  }
}

const service = new MultiTimeframeService();
service.start().catch(err => {
  console.error("Failed to start multi-timeframe service:", err);
  process.exit(1);
});
