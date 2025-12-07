/**
 * News Sentiment Agent Service
 * 
 * Microservice version of NewsSentimentAgent
 * Port: 5005
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";

class NewsSentimentService extends AgentServiceBase {
  constructor() {
    super("news-sentiment", 5005);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    // TODO: Integrate real news API
    // For now, return neutral with placeholder
    
    const apiUrl = process.env.CRYPTO_NEWS_API_URL;
    
    if (!apiUrl || apiUrl.includes("your-crypto-news-api-endpoint")) {
      return {
        score: 0,
        confidence: 30,
        payload: {
          sentiment: "neutral",
          note: "News API not configured"
        }
      };
    }

    try {
      // Placeholder for real API call
      // const response = await fetch(`${apiUrl}?symbol=${context.symbol}`);
      // const data = await response.json();
      
      return {
        score: 0,
        confidence: 30,
        payload: {
          sentiment: "neutral",
          note: "News API integration pending"
        }
      };
    } catch (err: any) {
      return {
        score: 0,
        confidence: 0,
        payload: {
          error: err?.message ?? String(err)
        }
      };
    }
  }
}

const service = new NewsSentimentService();
service.start().catch(err => {
  console.error("Failed to start news-sentiment service:", err);
  process.exit(1);
});
