/**
 * Autonomous Trading Brain - 24/7 Self-Managing Trading System
 * 
 * This orchestrator:
 * - Runs continuously without human intervention
 * - Makes AI-powered trading decisions using 3 AI models
 * - REASONS like professional traders (multi-timeframe, market context)
 * - PLANS every trade with detailed risk-reward analysis
 * - EXECUTES with precision (entry/exit strategies, position sizing)
 * - Manages risk automatically
 * - Adapts to market conditions
 * - Logs all decisions for transparency
 * - GOAL: €100/day profit with minimal risk
 */

import { multiAI } from "./multiAIProvider";
import { supabase } from "../core/supabase";
import { professionalBrain, ProfessionalReasoning } from "./professionalTraderReasoning";

export interface TradingConfig {
  accountId: string;
  maxDailyLoss: number; // USD
  maxPositionSize: number; // % of account
  minConfidence: number; // 0-100
  enableAutoTrading: boolean;
  tradingPairs: string[];
  checkInterval: number; // milliseconds
}

export class AutonomousTradingBrain {
  private config: TradingConfig;
  private isRunning: boolean = false;
  private dailyPnL: number = 0;
  private lastResetDate: string = "";

  constructor(config: TradingConfig) {
    this.config = config;
    this.lastResetDate = new Date().toISOString().split("T")[0];
  }

  /**
   * Start the autonomous trading loop
   */
  async start() {
    if (this.isRunning) {
      console.log("🤖 Trading Brain already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Autonomous Trading Brain ACTIVATED");
    console.log(`📊 Monitoring ${this.config.tradingPairs.join(", ")}`);
    console.log(`💰 Max Daily Loss: $${this.config.maxDailyLoss}`);
    console.log(`🎯 Min Confidence: ${this.config.minConfidence}%`);
    
    await this.tradingLoop();
  }

  /**
   * Stop the trading brain
   */
  stop() {
    this.isRunning = false;
    console.log("⏹️  Autonomous Trading Brain STOPPED");
  }

  /**
   * Main trading loop - runs 24/7
   */
  private async tradingLoop() {
    while (this.isRunning) {
      try {
        // Reset daily PnL at midnight
        this.resetDailyPnLIfNeeded();

        // Check if we hit daily loss limit
        if (this.dailyPnL <= -this.config.maxDailyLoss) {
          console.log(`🛑 Daily loss limit reached: $${this.dailyPnL.toFixed(2)}`);
          await this.logBrainDecision(
            "HALT",
            "Daily loss limit reached - stopping trading for today"
          );
          await this.sleep(60 * 60 * 1000); // Wait 1 hour
          continue;
        }

        // Analyze each trading pair
        for (const pair of this.config.tradingPairs) {
          await this.analyzePair(pair);
        }

        // Wait before next iteration
        await this.sleep(this.config.checkInterval);
      } catch (error) {
        console.error("❌ Trading loop error:", error);
        await this.sleep(60000); // Wait 1 min on error
      }
    }
  }

  /**
   * Analyze a single trading pair using PROFESSIONAL REASONING
   */
  private async analyzePair(symbol: string) {
    console.log(`\n🔍 Analyzing ${symbol} with Professional Trader Logic...`);

    // 1. Get latest agent signals
    const signals = await this.getRecentSignals(symbol);
    
    if (!signals || signals.length === 0) {
      console.log(`   No recent signals for ${symbol}`);
      return;
    }

    // 2. Get market data
    const marketData = await this.getMarketData(symbol);
    
    // 3. Get account balance
    const account = await this.getAccount();
    if (!account) {
      console.log(`   ❌ Failed to get account info`);
      return;
    }

    // 🧠 PROFESSIONAL REASONING ENGINE
    // This is where the AI thinks like a professional trader
    console.log(`\n   🧠 REASONING PHASE: Multi-timeframe analysis...`);
    const reasoning: ProfessionalReasoning = await professionalBrain.reason(
      marketData,
      signals,
      account.current_balance
    );
    
    // Display reasoning results
    console.log(`\n   📊 PROFESSIONAL ANALYSIS COMPLETE:`);
    console.log(`   ├─ Timeframe Alignment: ${reasoning.mtfAnalysis.alignment}%`);
    console.log(`   ├─ Higher TF (${reasoning.mtfAnalysis.higher.timeframe}): ${reasoning.mtfAnalysis.higher.trend.toUpperCase()} ${reasoning.mtfAnalysis.higher.signal}`);
    console.log(`   ├─ Current TF (${reasoning.mtfAnalysis.current.timeframe}): ${reasoning.mtfAnalysis.current.trend.toUpperCase()} ${reasoning.mtfAnalysis.current.signal}`);
    console.log(`   ├─ Lower TF (${reasoning.mtfAnalysis.lower.timeframe}): ${reasoning.mtfAnalysis.lower.trend.toUpperCase()} ${reasoning.mtfAnalysis.lower.signal}`);
    console.log(`   └─ Confidence: ${reasoning.mtfAnalysis.confidence}%`);
    
    if (reasoning.tradeSetup) {
      console.log(`\n   🎯 TRADE SETUP IDENTIFIED:`);
      console.log(`   ├─ Type: ${reasoning.tradeSetup.type.toUpperCase()}`);
      console.log(`   ├─ Quality: ${reasoning.tradeSetup.quality}% (${reasoning.tradeSetup.quality > 85 ? 'A+' : reasoning.tradeSetup.quality > 70 ? 'A' : 'B'})`);
      console.log(`   ├─ Timing: ${reasoning.tradeSetup.timing.toUpperCase()}`);
      console.log(`   ├─ Confluence: ${reasoning.tradeSetup.confluence.join(', ')}`);
      console.log(`   └─ Risks: ${reasoning.tradeSetup.risks.length > 0 ? reasoning.tradeSetup.risks.join(', ') : 'None'}`);
    }
    
    if (reasoning.riskReward) {
      console.log(`\n   💰 RISK-REWARD ANALYSIS:`);
      console.log(`   ├─ Entry: $${reasoning.riskReward.entryPrice.toFixed(2)}`);
      console.log(`   ├─ Stop Loss: $${reasoning.riskReward.stopLoss.toFixed(2)}`);
      console.log(`   ├─ Targets: ${reasoning.riskReward.targets.map(t => `$${t.price.toFixed(2)}`).join(' → ')}`);
      console.log(`   ├─ Risk: $${reasoning.riskReward.riskAmount.toFixed(2)}`);
      console.log(`   ├─ Reward: $${reasoning.riskReward.potentialReward.toFixed(2)}`);
      console.log(`   ├─ R:R Ratio: ${reasoning.riskReward.riskRewardRatio.toFixed(2)}:1 ${reasoning.riskReward.riskRewardRatio >= 2 ? '✅' : '❌'}`);
      console.log(`   ├─ Win Probability: ${reasoning.riskReward.winProbability}%`);
      console.log(`   ├─ Expected Value: $${reasoning.riskReward.expectedValue.toFixed(2)} ${reasoning.riskReward.expectedValue > 0 ? '✅' : '❌'}`);
      console.log(`   └─ Worth Taking: ${reasoning.riskReward.worthTaking ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log(`\n   🧠 MARKET PSYCHOLOGY:`);
    console.log(`   ├─ Fear/Greed Index: ${reasoning.psychology.fearGreedIndex}/100 (${reasoning.psychology.sentiment})`);
    console.log(`   ├─ Crowd: ${reasoning.psychology.crowdBehavior}`);
    console.log(`   ├─ Market Regime: ${reasoning.psychology.marketRegime.toUpperCase()}`);
    console.log(`   ├─ Contrarian Signal: ${reasoning.psychology.contrarian.signal.toUpperCase()} (${reasoning.psychology.contrarian.strength}%)`);
    console.log(`   └─ Smart Money: ${reasoning.psychology.smartMoney.activity.toUpperCase()} (${reasoning.psychology.smartMoney.confidence}%)`);
    
    console.log(`\n   ✅ FINAL DECISION:`);
    console.log(`   ├─ Action: ${reasoning.decision.action.toUpperCase()}`);
    console.log(`   ├─ Confidence: ${reasoning.decision.confidence}%`);
    console.log(`   ├─ Reasoning:`);
    reasoning.decision.reasoning.forEach(r => console.log(`   │  • ${r}`));
    if (reasoning.decision.warnings.length > 0) {
      console.log(`   ├─ Warnings:`);
      reasoning.decision.warnings.forEach(w => console.log(`   │  ⚠️  ${w}`));
    }
    
    console.log(`   └─ Checklist:`);
    reasoning.decision.checklist.forEach(item => {
      const icon = item.passed ? '✅' : '❌';
      const weight = item.weight >= 90 ? '[CRITICAL]' : item.weight >= 70 ? '[IMPORTANT]' : '[OPTIONAL]';
      console.log(`      ${icon} ${item.item} ${weight}`);
    });

    // 4. Ask Multi-AI for validation (3 AIs must agree)
    console.log(`\n   🤖 MULTI-AI VALIDATION...`);
    const aiAnalysis = await multiAI.analyzeMarket({
      agentName: "autonomous-brain",
      marketData,
      technicalIndicators: this.aggregateSignals(signals),
      contextWindow: 24 // hours
    });

    console.log(`   📊 AI Consensus: ${aiAnalysis.aiConsensus?.agreement.toFixed(1)}% agreement`);
    console.log(`   📍 AI Direction: ${aiAnalysis.direction.toUpperCase()}`);
    console.log(`   🎯 AI Confidence: ${aiAnalysis.confidence}%`);
    console.log(`   💭 AI Reasoning: ${aiAnalysis.reasoning}`);

    // 5. Make final trading decision (Professional reasoning + AI validation)
    if (this.config.enableAutoTrading) {
      await this.executeProfessionalTrade(symbol, reasoning, aiAnalysis, account);
    } else {
      console.log(`\n   📝 Auto-trading disabled - logging analysis only`);
      await this.logBrainDecision(
        reasoning.decision.action,
        reasoning.decision.reasoning.join('; '),
        {
          symbol,
          confidence: reasoning.decision.confidence,
          aiConfidence: aiAnalysis.confidence,
          setup: reasoning.tradeSetup?.type,
          riskReward: reasoning.riskReward?.riskRewardRatio
        }
      );
    }
  }

  /**
   * Execute professional trade based on reasoning + AI validation
   */
  private async executeProfessionalTrade(
    symbol: string,
    reasoning: ProfessionalReasoning,
    aiAnalysis: any,
    account: any
  ) {
    console.log(`\n   💼 EXECUTION PHASE...`);
    
    // Check if professional reasoning says to wait
    if (reasoning.decision.action === "wait") {
      console.log(`   ⏸️  Professional analysis: ${reasoning.decision.warnings[0] || 'No valid setup'}`);
      return;
    }
    
    // Check if AI validation agrees
    const aiDirection = aiAnalysis.direction === "buy" ? "enter-long" : 
                       aiAnalysis.direction === "sell" ? "enter-short" : "wait";
    
    if (aiDirection !== reasoning.decision.action) {
      console.log(`   ⚠️  AI disagrees with professional analysis - skipping trade for safety`);
      console.log(`   │  Professional: ${reasoning.decision.action}`);
      console.log(`   │  AI: ${aiDirection}`);
      return;
    }
    
    // Both systems agree - proceed with trade
    if (!reasoning.tradePlan) {
      console.log(`   ❌ No trade plan generated - cannot execute`);
      return;
    }
    
    const plan = reasoning.tradePlan;
    
    console.log(`\n   📋 TRADE PLAN:`);
    console.log(`   ├─ Entry Strategy: ${plan.entry.strategy.toUpperCase()}`);
    console.log(`   ├─ Entry Prices: ${plan.entry.prices.map(p => `$${p.toFixed(2)}`).join(' → ')}`);
    console.log(`   ├─ Position Sizes: ${plan.entry.sizes.map(s => `${s}%`).join(' → ')}`);
    console.log(`   ├─ Stop Loss: $${plan.exit.stopLoss.toFixed(2)}`);
    console.log(`   ├─ Take Profits: ${plan.exit.targets.map(t => `$${t.price.toFixed(2)} (${t.size}%)`).join(' → ')}`);
    console.log(`   ├─ Position Size: $${plan.positionSize.usdValue.toFixed(2)} (${plan.positionSize.percentOfAccount.toFixed(1)}% of account)`);
    console.log(`   ├─ Leverage: ${plan.positionSize.leverage}x`);
    console.log(`   ├─ Risk: ${plan.positionSize.risk.toFixed(2)}% of account`);
    console.log(`   └─ Expected Duration: ${plan.expectedDuration}`);
    
    console.log(`\n   🎬 EXECUTION METHOD:`);
    console.log(`   ├─ Priority: ${reasoning.execution.priority.toUpperCase()}`);
    console.log(`   ├─ Method: ${reasoning.execution.method.toUpperCase()}`);
    console.log(`   ├─ Urgency: ${reasoning.execution.urgency}/100`);
    console.log(`   └─ Notes: ${reasoning.execution.notes.join(', ')}`);

    // Create detailed trade signal with professional plan
    const direction = reasoning.decision.action === "enter-long" ? "buy" : "sell";
    
    const { data, error } = await supabase.from("trade_signals").insert({
      account_id: this.config.accountId,
      symbol,
      timeframe: plan.timeframe,
      direction,
      confidence: Math.min(reasoning.decision.confidence, aiAnalysis.confidence),
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
        aiValidation: {
          agreement: aiAnalysis.aiConsensus?.agreement,
          reasoning: aiAnalysis.reasoning
        },
        tradePlan: {
          entryStrategy: plan.entry.strategy,
          exitTargets: plan.exit.targets,
          trailingStop: plan.exit.trailingStop,
          scenarios: plan.scenarios
        }
      }),
      created_by_agent: "professional-brain"
    }).select();

    if (error) {
      console.error(`\n   ❌ Failed to create trade signal:`, error.message);
      return;
    }

    console.log(`\n   ✅ TRADE SIGNAL CREATED SUCCESSFULLY`);
    console.log(`   📈 ${direction.toUpperCase()} ${symbol} @ $${plan.entry.prices[0].toFixed(2)}`);
    console.log(`   💰 Position: $${plan.positionSize.usdValue.toFixed(2)} (${plan.positionSize.leverage}x leverage)`);
    console.log(`   🎯 Targets: ${plan.exit.targets.map(t => `$${t.price.toFixed(2)}`).join(' → ')}`);
    console.log(`   🛡️  Stop: $${plan.exit.stopLoss.toFixed(2)}`);
    console.log(`   📊 R:R: ${reasoning.riskReward?.riskRewardRatio.toFixed(2)}:1`);
    console.log(`   🎲 Win Prob: ${reasoning.riskReward?.winProbability}%`);

    // Log comprehensive brain decision
    await this.logBrainDecision(
      `PROFESSIONAL_TRADE_${direction.toUpperCase()}`,
      `Executed ${plan.setup.type} setup on ${symbol} with ${plan.setup.quality}% quality. ` +
      `R:R ${reasoning.riskReward?.riskRewardRatio.toFixed(2)}:1, Win Prob ${reasoning.riskReward?.winProbability}%. ` +
      `Professional + AI consensus: ${Math.min(reasoning.decision.confidence, aiAnalysis.confidence)}%`,
      {
        symbol,
        setupType: plan.setup.type,
        setupQuality: plan.setup.quality,
        confidence: reasoning.decision.confidence,
        aiConfidence: aiAnalysis.confidence,
        riskReward: reasoning.riskReward?.riskRewardRatio,
        positionSize: plan.positionSize.usdValue,
        risk: plan.positionSize.risk
      }
    );
  }

  /**
   * Original execution method (deprecated - keeping for backward compatibility)
   */
  private async executeTradingDecision(
    symbol: string,
    aiAnalysis: any,
    signals: any[]
  ) {
    // Check confidence threshold
    if (aiAnalysis.confidence < this.config.minConfidence) {
      console.log(`   ⏸️  Confidence too low (${aiAnalysis.confidence}% < ${this.config.minConfidence}%)`);
      return;
    }

    // Check risk level
    if (aiAnalysis.riskLevel === "high" && aiAnalysis.confidence < 80) {
      console.log(`   ⚠️  High risk + low confidence - skipping trade`);
      return;
    }

    // Skip neutral signals
    if (aiAnalysis.direction === "neutral") {
      console.log(`   ➡️  Neutral signal - no action`);
      return;
    }

    // Get account info
    const account = await this.getAccount();
    if (!account) {
      console.log(`   ❌ Failed to get account info`);
      return;
    }

    // Get current market data
    const marketData = await this.getMarketData(symbol);
    if (!marketData) {
      console.log(`   ❌ Failed to get market data`);
      return;
    }

    // Calculate position size
    const positionSize = this.calculatePositionSize(
      account.current_balance,
      aiAnalysis.riskLevel
    );

    console.log(`   ✅ EXECUTING ${aiAnalysis.direction.toUpperCase()} TRADE`);
    console.log(`   💵 Position Size: $${positionSize.toFixed(2)}`);
    console.log(`   📍 Entry Price: $${marketData.close.toFixed(2)}`);

    // Create trade signal
    const { data, error } = await supabase.from("trade_signals").insert({
      account_id: this.config.accountId,
      symbol,
      timeframe: "1h",
      direction: aiAnalysis.direction,
      confidence: aiAnalysis.confidence,
      entry_price: marketData.close,
      suggested_stop_loss: this.calculateStopLoss(
        marketData.close,
        aiAnalysis.direction,
        aiAnalysis.riskLevel
      ),
      suggested_take_profit: this.calculateTakeProfit(
        marketData.close,
        aiAnalysis.direction,
        aiAnalysis.riskLevel
      ),
      ai_reasoning: aiAnalysis.reasoning,
      position_size_usd: positionSize
    }).select();

    if (error) {
      console.error(`   ❌ Failed to create trade signal:`, error.message);
      return;
    }

    // Log brain decision
    await this.logBrainDecision(
      `TRADE_${aiAnalysis.direction.toUpperCase()}`,
      `Executed ${aiAnalysis.direction} on ${symbol} with ${aiAnalysis.confidence}% confidence. Size: $${positionSize.toFixed(2)}`,
      {
        symbol,
        confidence: aiAnalysis.confidence,
        positionSize,
        risk: aiAnalysis.riskLevel
      }
    );
  }

  /**
   * Calculate position size based on account balance and risk
   */
  private calculatePositionSize(balance: number, riskLevel: string): number {
    let sizePercent = this.config.maxPositionSize;
    
    // Adjust based on risk
    if (riskLevel === "high") sizePercent *= 0.5; // 50% of max
    if (riskLevel === "low") sizePercent *= 1.5; // 150% of max (capped)
    
    // Cap at configured max
    sizePercent = Math.min(sizePercent, this.config.maxPositionSize);
    
    return balance * (sizePercent / 100);
  }

  /**
   * Calculate stop loss price
   */
  private calculateStopLoss(
    entryPrice: number,
    direction: string,
    riskLevel: string
  ): number {
    let stopPercent = 0.02; // 2% default
    
    if (riskLevel === "high") stopPercent = 0.015; // Tighter stop
    if (riskLevel === "low") stopPercent = 0.03; // Wider stop
    
    if (direction === "buy") {
      return entryPrice * (1 - stopPercent);
    } else {
      return entryPrice * (1 + stopPercent);
    }
  }

  /**
   * Calculate take profit price
   */
  private calculateTakeProfit(
    entryPrice: number,
    direction: string,
    riskLevel: string
  ): number {
    let targetPercent = 0.04; // 4% default (2:1 R:R)
    
    if (riskLevel === "low") targetPercent = 0.06; // 6% for low risk
    
    if (direction === "buy") {
      return entryPrice * (1 + targetPercent);
    } else {
      return entryPrice * (1 - targetPercent);
    }
  }

  /**
   * Get recent signals from all agents
   */
  private async getRecentSignals(symbol: string) {
    const { data, error } = await supabase
      .from("agent_signals")
      .select("*")
      .eq("symbol", symbol)
      .gte("created_at", new Date(Date.now() - 30 * 60_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to get signals:", error.message);
      return null;
    }

    return data;
  }

  /**
   * Get current market data
   */
  private async getMarketData(symbol: string) {
    // This would connect to your exchange API
    // For now, returning mock data structure
    return {
      symbol,
      close: 45000, // Last price
      volume: 1000000,
      high24h: 46000,
      low24h: 44000,
      change24h: 2.5
    };
  }

  /**
   * Get account information
   */
  private async getAccount() {
    const { data, error } = await supabase
      .from("trading_accounts")
      .select("*")
      .eq("id", this.config.accountId)
      .single();

    if (error) {
      console.error("Failed to get account:", error.message);
      return null;
    }

    return data;
  }

  /**
   * Aggregate signals into technical indicators
   */
  private aggregateSignals(signals: any[]) {
    const buySignals = signals.filter(s => s.direction === "buy").length;
    const sellSignals = signals.filter(s => s.direction === "sell").length;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

    return {
      totalSignals: signals.length,
      buySignals,
      sellSignals,
      avgConfidence,
      sentiment: buySignals > sellSignals ? "bullish" : sellSignals > buySignals ? "bearish" : "neutral",
      agentConsensus: (Math.max(buySignals, sellSignals) / signals.length) * 100
    };
  }

  /**
   * Log brain decision to database
   */
  private async logBrainDecision(
    action: string,
    reasoning: string,
    metadata: any = {}
  ) {
    await supabase.from("brain_decisions").insert({
      account_id: this.config.accountId,
      action,
      reasoning,
      metadata,
      daily_pnl: this.dailyPnL
    });
  }

  /**
   * Reset daily PnL at midnight
   */
  private resetDailyPnLIfNeeded() {
    const today = new Date().toISOString().split("T")[0];
    if (today !== this.lastResetDate) {
      console.log(`📅 New trading day - resetting daily PnL`);
      this.dailyPnL = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      running: this.isRunning,
      dailyPnL: this.dailyPnL,
      autoTrading: this.config.enableAutoTrading,
      monitoringPairs: this.config.tradingPairs,
      lastUpdate: new Date().toISOString()
    };
  }
}
