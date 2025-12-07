/**
 * Multi-AI Trading Provider
 * 
 * Uses THREE AI models to validate trading decisions:
 * 1. Google Gemini (fast, good at data analysis)
 * 2. OpenAI GPT-4 (deep reasoning, risk assessment)
 * 3. DeepSeek (cost-effective, pattern recognition)
 * 
 * Strategy: Get consensus from all 3 AIs before making trades
 * Goal: €100/day with minimal risk through AI validation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import axios from "axios";

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
  agreement?: number; // How much AIs agree (0-100%)
  aiConsensus?: {
    gemini: any;
    openai: any;
    deepseek: any;
    agreement: number; // How much they agree (0-100%)
  };
}

export class MultiAIProvider {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;
  private geminiModel: any = null;
  private deepseekApiKey: string | null = null;
  
  constructor() {
    this.initializeAI();
  }

  private initializeAI() {
    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = this.geminiClient.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.2, // Very conservative
          topK: 40,
          topP: 0.95,
        }
      });
      console.log("✅ Gemini AI initialized");
    }

    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== "your_openai_api_key_here") {
      this.openaiClient = new OpenAI({
        apiKey: openaiKey
      });
      console.log("✅ OpenAI initialized");
    }

    // Initialize DeepSeek
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (deepseekKey && deepseekKey !== "your_deepseek_api_key_here") {
      this.deepseekApiKey = deepseekKey;
      console.log("✅ DeepSeek initialized");
    }

    const activeAIs = [this.geminiModel, this.openaiClient, this.deepseekApiKey].filter(Boolean).length;
    console.log(`🤖 Multi-AI System: ${activeAIs}/3 AIs active`);
  }

  /**
   * MAIN METHOD: Get consensus from all 3 AIs
   * This is the magic that will help you make €100/day safely
   */
  async analyzeMarket(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    console.log(`\n🧠 Multi-AI Analysis for ${request.agentName}...`);
    
    const results = await Promise.allSettled([
      this.analyzeWithGemini(request),
      this.analyzeWithOpenAI(request),
      this.analyzeWithDeepSeek(request)
    ]);

    // Extract successful results
    const analyses = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map(r => r.value);

    if (analyses.length === 0) {
      console.log("⚠️  All AIs failed, using fallback");
      return this.fallbackAnalysis(request);
    }

    // Calculate consensus
    const consensus = this.calculateConsensus(analyses);
    console.log(`   📊 AI Consensus: ${(consensus.agreement ?? 0).toFixed(1)}% agreement`);
    console.log(`   📍 Final Direction: ${consensus.direction.toUpperCase()}`);
    console.log(`   🎯 Confidence: ${consensus.confidence}%`);

    return {
      ...consensus,
      aiConsensus: {
        gemini: analyses[0] || null,
        openai: analyses[1] || null,
        deepseek: analyses[2] || null,
        agreement: consensus.agreement ?? 0
      }
    };
  }

  /**
   * Analyze with Google Gemini (Fast & Analytical)
   */
  private async analyzeWithGemini(request: AIAnalysisRequest): Promise<any> {
    if (!this.geminiModel) throw new Error("Gemini not available");

    const prompt = this.buildTradingPrompt(request, "Gemini");
    const result = await this.geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseAIResponse(text, "gemini");
  }

  /**
   * Analyze with OpenAI GPT-4 (Deep Reasoning)
   */
  private async analyzeWithOpenAI(request: AIAnalysisRequest): Promise<any> {
    if (!this.openaiClient) throw new Error("OpenAI not available");

    const prompt = this.buildTradingPrompt(request, "OpenAI");
    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        {
          role: "system",
          content: "You are an expert cryptocurrency trading analyst focused on risk management and profitable trades."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    const text = completion.choices[0]?.message?.content || "";
    return this.parseAIResponse(text, "openai");
  }

  /**
   * Analyze with DeepSeek (Cost-Effective Pattern Recognition)
   */
  private async analyzeWithDeepSeek(request: AIAnalysisRequest): Promise<any> {
    if (!this.deepseekApiKey) throw new Error("DeepSeek not available");

    const prompt = this.buildTradingPrompt(request, "DeepSeek");
    
    const response = await axios.post<{
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    }>(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert at recognizing profitable trading patterns in cryptocurrency markets."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      },
      {
        headers: {
          "Authorization": `Bearer ${this.deepseekApiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0]?.message?.content || "";
    return this.parseAIResponse(text, "deepseek");
  }

  /**
   * Build optimized trading prompt
   */
  private buildTradingPrompt(request: AIAnalysisRequest, aiName: string): string {
    const { marketData, technicalIndicators, newsData } = request;

    return `You are analyzing ${marketData?.symbol || 'crypto'} for a profitable day trading opportunity.

GOAL: Help the trader make €100 today with minimal risk.

CURRENT MARKET DATA:
- Price: $${marketData?.close || 'N/A'}
- 24h Change: ${marketData?.change24h || 'N/A'}%
- Volume: ${marketData?.volume || 'N/A'}
- High: $${marketData?.high24h || 'N/A'}
- Low: $${marketData?.low24h || 'N/A'}

TECHNICAL INDICATORS:
${JSON.stringify(technicalIndicators || {}, null, 2)}

${newsData ? `RECENT NEWS:\n${JSON.stringify(newsData, null, 2)}\n` : ''}

ANALYZE AND RESPOND IN THIS JSON FORMAT:
{
  "direction": "buy|sell|neutral",
  "confidence": <0-100>,
  "riskLevel": "low|medium|high",
  "reasoning": "Clear explanation in 2-3 sentences focusing on profitability and risk",
  "suggestedActions": ["specific action 1", "specific action 2"],
  "profitPotential": "€X to €Y based on position size and market conditions"
}

Focus on:
1. Clear profit potential (aim for €100/day target)
2. Risk-reward ratio (minimum 2:1)
3. Market momentum and volume
4. Entry/exit timing

Be conservative - only recommend trades with high probability of profit.`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(text: string, aiName: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ai: aiName,
          direction: parsed.direction || "neutral",
          confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
          riskLevel: parsed.riskLevel || "medium",
          reasoning: parsed.reasoning || "Analysis completed",
          suggestedActions: parsed.suggestedActions || [],
          profitPotential: parsed.profitPotential || "Unknown"
        };
      }
    } catch (error) {
      console.error(`${aiName} parse error:`, error);
    }

    return {
      ai: aiName,
      direction: "neutral",
      confidence: 30,
      riskLevel: "high",
      reasoning: `${aiName} analysis inconclusive`,
      suggestedActions: [],
      profitPotential: "Unknown"
    };
  }

  /**
   * Calculate consensus from multiple AI responses
   * This is the KEY to reducing losses!
   */
  private calculateConsensus(analyses: any[]): AIAnalysisResponse {
    if (analyses.length === 0) {
      return this.fallbackAnalysis({} as any);
    }

    // Count votes for each direction
    const votes: Record<"buy" | "sell" | "neutral", number> = {
      buy: 0,
      sell: 0,
      neutral: 0
    };

    analyses.forEach((a: { direction: "buy" | "sell" | "neutral" }) => {
      if (a.direction && (a.direction === "buy" || a.direction === "sell" || a.direction === "neutral")) {
        votes[a.direction]++;
      }
    });

    // Determine consensus direction
    const totalVotes = analyses.length;
    const buyPercent = (votes.buy / totalVotes) * 100;
    const sellPercent = (votes.sell / totalVotes) * 100;
    const neutralPercent = (votes.neutral / totalVotes) * 100;

    let direction: "buy" | "sell" | "neutral" = "neutral";
    let agreement = 0;

    if (buyPercent >= 66) { // 2/3 agreement
      direction = "buy";
      agreement = buyPercent;
    } else if (sellPercent >= 66) {
      direction = "sell";
      agreement = sellPercent;
    } else {
      direction = "neutral";
      agreement = Math.max(buyPercent, sellPercent, neutralPercent);
    }

    // Average confidence (weighted by AI agreement)
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    
    // SAFETY: Lower confidence if AIs disagree
    const consensusConfidence = Math.round(avgConfidence * (agreement / 100));

    // Determine risk level
    const riskCounts = analyses.reduce((acc, a) => {
      acc[a.riskLevel] = (acc[a.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const riskLevel = Object.entries(riskCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as any || "medium";

    // Combine reasoning from all AIs
    const reasoning = `Multi-AI Consensus (${agreement.toFixed(0)}% agreement): ${
      analyses.map(a => `${a.ai}: ${a.reasoning}`).join(" | ")
    }`;

    // Combine suggested actions
    const suggestedActions = analyses.flatMap(a => a.suggestedActions);

    return {
      confidence: consensusConfidence,
      direction,
      reasoning,
      riskLevel,
      suggestedActions,
      timeframe: "1h",
      agreement
    };
  }

  /**
   * Fallback when AIs are not available
   */
  private fallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResponse {
    return {
      confidence: 40,
      direction: "neutral",
      reasoning: "No AI available - using conservative default",
      riskLevel: "high",
      suggestedActions: ["Wait for AI confirmation", "Monitor price action"],
      timeframe: "1h"
    };
  }

  /**
   * Get trading advice from chat
   */
  async getChatAdvice(userMessage: string, tradingContext: any): Promise<string> {
    // Try Gemini first (fastest)
    if (this.geminiModel) {
      try {
        const prompt = `You are a professional trading advisor. Goal: Help make €100/day profit safely.

Current Status:
- Account Balance: €${tradingContext.account?.current_balance || 0}
- Daily P&L: €${tradingContext.dailyPnL || 0}
- Active Trades: ${tradingContext.activeTradesCount || 0}

User Question: ${userMessage}

Provide actionable advice in 2-3 paragraphs. Focus on risk management and profit opportunities.`;

        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error("Gemini chat error:", error);
      }
    }

    // Fallback to OpenAI
    if (this.openaiClient) {
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a trading advisor focused on €100/day profit with risk management." },
            { role: "user", content: userMessage }
          ],
          max_tokens: 300
        });
        return completion.choices[0]?.message?.content || "No response";
      } catch (error) {
        console.error("OpenAI chat error:", error);
      }
    }

    return "AI chat unavailable. Please configure at least one AI API key.";
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      gemini: !!this.geminiModel,
      openai: !!this.openaiClient,
      deepseek: !!this.deepseekApiKey,
      activeCount: [this.geminiModel, this.openaiClient, this.deepseekApiKey].filter(Boolean).length
    };
  }
}

// Singleton instance
export const multiAI = new MultiAIProvider();
