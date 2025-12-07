/**
 * AI Provider - Centralized LLM integration for all trading agents
 * Supports: Gemini, OpenAI, and fallback to rule-based analysis
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIAnalysisRequest {
  agentName: string;
  marketData: any;
  technicalIndicators?: any;
  newsData?: any;
  contextWindow?: number;
}

export interface AIAnalysisResponse {
  confidence: number; // 0-100
  direction: "buy" | "sell" | "neutral";
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
  suggestedActions: string[];
  timeframe: string;
}

export class AIProvider {
  private geminiClient: GoogleGenerativeAI | null = null;
  private model: any = null;
  
  constructor() {
    this.initializeAI();
  }

  private initializeAI() {
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
      this.model = this.geminiClient.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.3, // Lower = more conservative
          topK: 40,
          topP: 0.95,
        }
      });
      console.log("✅ AI Provider initialized with Gemini");
    } else {
      console.warn("⚠️  No AI API key found - using rule-based analysis");
    }
  }

  /**
   * Analyze market data using AI
   */
  async analyzeMarket(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.model) {
      return this.fallbackAnalysis(request);
    }

    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAIResponse(text, request.agentName);
    } catch (error) {
      console.error(`AI Analysis error for ${request.agentName}:`, error);
      return this.fallbackAnalysis(request);
    }
  }

  /**
   * Build prompt for AI based on agent type
   */
  private buildPrompt(request: AIAnalysisRequest): string {
    const { agentName, marketData, technicalIndicators, newsData } = request;

    const basePrompt = `You are an expert cryptocurrency trading analyst specializing in ${agentName}.

Current Market Data:
${JSON.stringify(marketData, null, 2)}

${technicalIndicators ? `Technical Indicators:\n${JSON.stringify(technicalIndicators, null, 2)}\n` : ''}
${newsData ? `Recent News:\n${JSON.stringify(newsData, null, 2)}\n` : ''}

Analyze this data and provide:
1. Trading Direction (buy/sell/neutral)
2. Confidence Level (0-100)
3. Risk Level (low/medium/high)
4. Detailed Reasoning (2-3 sentences)
5. Suggested Actions (specific trading recommendations)

Format your response as JSON:
{
  "direction": "buy|sell|neutral",
  "confidence": <0-100>,
  "riskLevel": "low|medium|high",
  "reasoning": "your detailed analysis",
  "suggestedActions": ["action1", "action2"]
}`;

    return basePrompt;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(text: string, agentName: string): AIAnalysisResponse {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
          direction: parsed.direction || "neutral",
          reasoning: parsed.reasoning || "AI analysis completed",
          riskLevel: parsed.riskLevel || "medium",
          suggestedActions: parsed.suggestedActions || [],
          timeframe: "1h"
        };
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error);
    }

    // Fallback if parsing fails
    return {
      confidence: 50,
      direction: "neutral",
      reasoning: text.substring(0, 200),
      riskLevel: "medium",
      suggestedActions: [],
      timeframe: "1h"
    };
  }

  /**
   * Rule-based analysis when AI is not available
   */
  private fallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResponse {
    const { technicalIndicators } = request;
    
    // Simple technical analysis fallback
    let confidence = 50;
    let direction: "buy" | "sell" | "neutral" = "neutral";
    
    if (technicalIndicators) {
      // Example: RSI-based decision
      if (technicalIndicators.rsi < 30) {
        direction = "buy";
        confidence = 70;
      } else if (technicalIndicators.rsi > 70) {
        direction = "sell";
        confidence = 70;
      }
    }

    return {
      confidence,
      direction,
      reasoning: `Rule-based analysis: ${request.agentName} evaluation`,
      riskLevel: "medium",
      suggestedActions: ["Monitor price action", "Wait for confirmation"],
      timeframe: "1h"
    };
  }

  /**
   * Get trading advice from AI chat
   */
  async getChatAdvice(
    userMessage: string, 
    tradingContext: any
  ): Promise<string> {
    if (!this.model) {
      return "AI chat is not available. Please configure GEMINI_API_KEY in your .env file.";
    }

    try {
      const prompt = `You are an expert cryptocurrency trading advisor. The user has an active trading system with the following context:

Current Portfolio:
${JSON.stringify(tradingContext.account, null, 2)}

Recent Signals:
${JSON.stringify(tradingContext.recentSignals?.slice(0, 5), null, 2)}

Active Agents:
${tradingContext.activeAgents?.join(", ")}

User Question: ${userMessage}

Provide a clear, actionable response focused on:
- Market analysis
- Risk management
- Trading strategy
- Specific recommendations

Keep your response concise and professional (max 3 paragraphs).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Chat error:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }
}

// Singleton instance
export const aiProvider = new AIProvider();
