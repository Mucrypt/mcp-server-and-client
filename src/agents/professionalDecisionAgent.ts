/**
 * Professional Decision Agent - Integrates Professional Trader Reasoning into Pipeline
 * 
 * This agent replaces the simple weighted scoring approach with sophisticated
 * professional trader reasoning that:
 * - Analyzes multi-timeframe alignment
 * - Identifies high-quality trade setups
 * - Calculates risk-reward ratios
 * - Analyzes market psychology
 * - Creates detailed trade plans
 * - Validates through 8-point checklist
 * 
 * Used in pipeline mode to make final trading decisions.
 */

import { professionalBrain, ProfessionalReasoning } from "../ai/professionalTraderReasoning";
import { multiAI } from "../ai/multiAIProvider";
import { supabase } from "../core/supabase";
import { enqueueExecution } from "../execution/executionQueue";

export type PipelineContext = {
  accountId: string;
  symbol: string;
  timeframe: string;
  account?: any;
  marketData?: {
    ohlc_1m?: any[];
    ohlc_5m?: any[];
    ohlc_15m?: any[];
    ohlc_1h?: any[];
    ohlc_4h?: any[];
    ohlc_1d?: any[];
  };
  agentResults: Record<string, { score: number; confidence: number; payload?: any }>;
};

export type AgentResult = {
  score: number;
  confidence: number;
  payload?: any;
};

export type DecisionResult = {
  finalScore: number;
  direction: "buy" | "sell" | "hold";
  confidence: number;
  leverage: number;
  reasoning?: ProfessionalReasoning;
};

/**
 * Professional Decision Agent for Pipeline Mode
 */
export class ProfessionalDecisionAgent {
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  /**
   * Main pipeline execution method
   * Uses professional reasoning instead of simple weighted scoring
   */
  async run(context: PipelineContext): Promise<DecisionResult> {
    console.log(`\n🧠 Professional Decision Agent Starting...`);
    console.log(`   Account: ${context.accountId}`);
    console.log(`   Symbol: ${context.symbol}`);
    console.log(`   Timeframe: ${context.timeframe}`);

    // 1. Validate we have agent signals
    const agentSignals = this.convertContextToSignals(context);
    
    if (agentSignals.length === 0) {
      console.log(`   ⚠️  No agent signals available`);
      return this.getHoldDecision("No agent signals");
    }

    // 2. Build market data from context
    const marketData = this.buildMarketDataFromContext(context);

    // 3. Get account balance
    const accountBalance = context.account?.current_balance || context.account?.starting_balance || 10000;

    // 4. 🧠 PROFESSIONAL REASONING ENGINE
    console.log(`\n   🧠 INITIATING PROFESSIONAL REASONING...`);
    
    const reasoning: ProfessionalReasoning = await professionalBrain.reason(
      marketData,
      agentSignals,
      accountBalance
    );

    // 5. Log professional analysis
    this.logProfessionalAnalysis(reasoning);

    // 6. Multi-AI Validation (if decision is not "wait")
    let aiValidation: any = null;
    
    if (reasoning.decision.action !== "wait") {
      console.log(`\n   🤖 MULTI-AI VALIDATION...`);
      
      aiValidation = await multiAI.analyzeMarket({
        agentName: "professional-decision",
        marketData,
        technicalIndicators: this.aggregateSignals(agentSignals),
        contextWindow: 24
      });

      console.log(`   📊 AI Consensus: ${aiValidation.aiConsensus?.agreement.toFixed(1)}% agreement`);
      console.log(`   📍 AI Direction: ${aiValidation.direction.toUpperCase()}`);
      console.log(`   🎯 AI Confidence: ${aiValidation.confidence}%`);

      // Check if AI agrees with professional reasoning
      const aiDirection = aiValidation.direction === "buy" ? "enter-long" : 
                         aiValidation.direction === "sell" ? "enter-short" : "wait";
      
      if (aiDirection !== reasoning.decision.action) {
        console.log(`   ⚠️  AI disagrees with professional analysis`);
        console.log(`   │  Professional: ${reasoning.decision.action}`);
        console.log(`   │  AI: ${aiDirection}`);
        console.log(`   │  Defaulting to HOLD for safety`);
        
        return this.getHoldDecision("AI validation disagreement", reasoning);
      }
    }

    // 7. Create final decision
    const decision = this.createFinalDecision(reasoning, aiValidation, context);

    // 8. If decision is to trade, create trade signal and enqueue
    if (decision.direction !== "hold" && reasoning.tradePlan) {
      await this.createTradeSignal(reasoning, aiValidation, context);
    }

    return decision;
  }

  /**
   * Convert pipeline context agent results to signal format
   */
  private convertContextToSignals(context: PipelineContext): any[] {
    const signals: any[] = [];

    for (const [agentName, result] of Object.entries(context.agentResults)) {
      signals.push({
        agent_name: agentName,
        score: result.score,
        confidence: result.confidence,
        payload: result.payload,
        symbol: context.symbol,
        timeframe: context.timeframe
      });
    }

    return signals;
  }

  /**
   * Build market data object from context
   */
  private buildMarketDataFromContext(context: PipelineContext): any {
    const ohlc_1h = context.marketData?.ohlc_1h || [];
    const ohlc_4h = context.marketData?.ohlc_4h || [];
    const ohlc_1d = context.marketData?.ohlc_1d || [];

    const latest1h = ohlc_1h[ohlc_1h.length - 1];
    const latest4h = ohlc_4h[ohlc_4h.length - 1];

    return {
      symbol: context.symbol,
      timeframe: context.timeframe,
      close: latest1h?.close || 50000,
      open: latest1h?.open || 50000,
      high: latest1h?.high || 50000,
      low: latest1h?.low || 50000,
      volume: latest1h?.volume || 1000000,
      ohlc_1h,
      ohlc_4h,
      ohlc_1d,
      // Add momentum calculation
      momentum: this.calculateMomentum(ohlc_1h),
      volatility: this.calculateVolatility(ohlc_1h)
    };
  }

  /**
   * Calculate momentum from OHLC data
   */
  private calculateMomentum(ohlc: any[]): number {
    if (ohlc.length < 20) return 0;

    const recent = ohlc.slice(-20);
    const avgPrice = recent.reduce((sum, c) => sum + c.close, 0) / recent.length;
    const current = ohlc[ohlc.length - 1].close;
    
    return ((current - avgPrice) / avgPrice) * 100;
  }

  /**
   * Calculate volatility from OHLC data
   */
  private calculateVolatility(ohlc: any[]): number {
    if (ohlc.length < 20) return 2;

    const recent = ohlc.slice(-20);
    const returns = recent.slice(1).map((c, i) => 
      (c.close - recent[i].close) / recent[i].close
    );
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100;
  }

  /**
   * Aggregate agent signals into technical indicators format
   */
  private aggregateSignals(signals: any[]): any {
    const scores = signals.map(s => s.score || 0);
    const confidences = signals.map(s => s.confidence || 50);
    
    return {
      avgScore: scores.reduce((sum, s) => sum + s, 0) / Math.max(scores.length, 1),
      avgConfidence: confidences.reduce((sum, c) => sum + c, 0) / Math.max(confidences.length, 1),
      signalCount: signals.length,
      bullishSignals: signals.filter(s => s.score > 0.2).length,
      bearishSignals: signals.filter(s => s.score < -0.2).length,
      neutralSignals: signals.filter(s => Math.abs(s.score) <= 0.2).length
    };
  }

  /**
   * Log professional analysis to console
   */
  private logProfessionalAnalysis(reasoning: ProfessionalReasoning): void {
    console.log(`\n   📊 PROFESSIONAL ANALYSIS COMPLETE:`);
    console.log(`   ├─ Timeframe Alignment: ${reasoning.mtfAnalysis.alignment}%`);
    console.log(`   ├─ Higher TF: ${reasoning.mtfAnalysis.higher.trend.toUpperCase()} ${reasoning.mtfAnalysis.higher.signal}`);
    console.log(`   ├─ Current TF: ${reasoning.mtfAnalysis.current.trend.toUpperCase()} ${reasoning.mtfAnalysis.current.signal}`);
    console.log(`   └─ Lower TF: ${reasoning.mtfAnalysis.lower.trend.toUpperCase()} ${reasoning.mtfAnalysis.lower.signal}`);
    
    if (reasoning.tradeSetup) {
      console.log(`\n   🎯 TRADE SETUP IDENTIFIED:`);
      console.log(`   ├─ Type: ${reasoning.tradeSetup.type.toUpperCase()}`);
      console.log(`   ├─ Quality: ${reasoning.tradeSetup.quality}% (${reasoning.tradeSetup.quality > 85 ? 'A+' : reasoning.tradeSetup.quality > 70 ? 'A' : 'B'})`);
      console.log(`   ├─ Timing: ${reasoning.tradeSetup.timing.toUpperCase()}`);
      console.log(`   └─ Confluence: ${reasoning.tradeSetup.confluence.join(', ')}`);
    }
    
    if (reasoning.riskReward) {
      console.log(`\n   💰 RISK-REWARD:`);
      console.log(`   ├─ R:R Ratio: ${reasoning.riskReward.riskRewardRatio.toFixed(2)}:1 ${reasoning.riskReward.riskRewardRatio >= 2 ? '✅' : '❌'}`);
      console.log(`   ├─ Win Probability: ${reasoning.riskReward.winProbability}%`);
      console.log(`   └─ Worth Taking: ${reasoning.riskReward.worthTaking ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log(`\n   ✅ FINAL DECISION:`);
    console.log(`   ├─ Action: ${reasoning.decision.action.toUpperCase()}`);
    console.log(`   ├─ Confidence: ${reasoning.decision.confidence}%`);
    console.log(`   └─ Reasoning: ${reasoning.decision.reasoning.join('; ')}`);
    
    if (reasoning.decision.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${reasoning.decision.warnings.join('; ')}`);
    }
  }

  /**
   * Create final decision from professional reasoning
   */
  private createFinalDecision(
    reasoning: ProfessionalReasoning,
    aiValidation: any,
    context: PipelineContext
  ): DecisionResult {
    
    if (reasoning.decision.action === "wait") {
      return {
        finalScore: 0,
        direction: "hold",
        confidence: 0,
        leverage: 0,
        reasoning
      };
    }

    const direction = reasoning.decision.action === "enter-long" ? "buy" : "sell";
    const finalScore = direction === "buy" ? 0.8 : -0.8;
    
    // Confidence is minimum of professional reasoning and AI validation
    const confidence = aiValidation 
      ? Math.min(reasoning.decision.confidence, aiValidation.confidence)
      : reasoning.decision.confidence;

    // Leverage from trade plan
    const leverage = reasoning.tradePlan?.positionSize.leverage || 1;

    return {
      finalScore,
      direction,
      confidence,
      leverage,
      reasoning
    };
  }

  /**
   * Get hold decision with reasoning
   */
  private getHoldDecision(reason: string, reasoning?: ProfessionalReasoning): DecisionResult {
    return {
      finalScore: 0,
      direction: "hold",
      confidence: 0,
      leverage: 0,
      reasoning
    };
  }

  /**
   * Create trade signal in database and enqueue for execution
   */
  private async createTradeSignal(
    reasoning: ProfessionalReasoning,
    aiValidation: any,
    context: PipelineContext
  ): Promise<void> {
    
    if (!reasoning.tradePlan) {
      console.log(`   ⚠️  No trade plan available - cannot create signal`);
      return;
    }

    const plan = reasoning.tradePlan;
    const direction = reasoning.decision.action === "enter-long" ? "buy" : "sell";

    console.log(`\n   📋 CREATING TRADE SIGNAL...`);

    const { data, error } = await supabase.from("trade_signals").insert({
      account_id: context.accountId,
      symbol: context.symbol,
      timeframe: context.timeframe,
      direction,
      confidence: Math.min(reasoning.decision.confidence, aiValidation?.confidence || 100),
      entry_price: plan.entry.prices[0],
      suggested_stop_loss: plan.exit.stopLoss,
      suggested_take_profit: plan.exit.targets[0].price,
      leverage: plan.positionSize.leverage,
      position_size_usd: plan.positionSize.usdValue,
      ai_reasoning: JSON.stringify({
        professionalReasoning: {
          setupType: plan.setup.type,
          setupQuality: plan.setup.quality,
          riskRewardRatio: reasoning.riskReward?.riskRewardRatio,
          winProbability: reasoning.riskReward?.winProbability,
          expectedValue: reasoning.riskReward?.expectedValue,
          timeframeAlignment: reasoning.mtfAnalysis.alignment,
          marketPsychology: reasoning.psychology.sentiment,
          checklist: reasoning.decision.checklist
        },
        aiValidation: aiValidation ? {
          agreement: aiValidation.aiConsensus?.agreement,
          reasoning: aiValidation.reasoning
        } : null,
        tradePlan: {
          entryStrategy: plan.entry.strategy,
          exitTargets: plan.exit.targets,
          trailingStop: plan.exit.trailingStop,
          scenarios: plan.scenarios
        }
      }),
      created_by_agent: "professional-decision"
    }).select();

    if (error) {
      console.error(`   ❌ Failed to create trade signal:`, error.message);
      return;
    }

    const signalId = data[0]?.id;
    if (!signalId) {
      console.error(`   ❌ No signal ID returned`);
      return;
    }

    console.log(`   ✅ Trade signal created: ${signalId}`);
    console.log(`   📈 ${direction.toUpperCase()} ${context.symbol} @ $${plan.entry.prices[0].toFixed(2)}`);
    console.log(`   💰 Size: $${plan.positionSize.usdValue.toFixed(2)} (${plan.positionSize.leverage}x)`);
    console.log(`   🎯 R:R: ${reasoning.riskReward?.riskRewardRatio.toFixed(2)}:1`);

    // Enqueue for execution
    await enqueueExecution(signalId);
    console.log(`   ✅ Enqueued for execution`);

    // Log brain decision
    await this.logBrainDecision(reasoning, aiValidation, context);
  }

  /**
   * Log brain decision to database for transparency
   */
  private async logBrainDecision(
    reasoning: ProfessionalReasoning,
    aiValidation: any,
    context: PipelineContext
  ): Promise<void> {
    
    const action = `PROFESSIONAL_TRADE_${reasoning.decision.action.toUpperCase()}`;
    const reasoningText = reasoning.decision.reasoning.join('; ');

    await supabase.from("brain_decisions").insert({
      account_id: context.accountId,
      symbol: context.symbol,
      action,
      reasoning: reasoningText,
      professional_reasoning: JSON.stringify({
        mtfAnalysis: reasoning.mtfAnalysis,
        tradeSetup: reasoning.tradeSetup,
        riskReward: reasoning.riskReward,
        psychology: reasoning.psychology,
        decision: reasoning.decision,
        execution: reasoning.execution
      }),
      ai_validation: aiValidation ? JSON.stringify(aiValidation) : null,
      metadata: {
        confidence: reasoning.decision.confidence,
        setupQuality: reasoning.tradeSetup?.quality,
        riskReward: reasoning.riskReward?.riskRewardRatio
      }
    });
  }
}

// Export singleton factory
export const createProfessionalDecisionAgent = (accountId: string) => 
  new ProfessionalDecisionAgent(accountId);
