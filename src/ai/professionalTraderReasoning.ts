/**
 * Professional Trader Reasoning Engine
 * 
 * This module implements sophisticated reasoning capabilities that mimic
 * how professional crypto traders think, plan, and execute trades:
 * 
 * 1. REASONING: Multi-timeframe analysis, market context, pattern recognition
 * 2. PLANNING: Trade setup identification, risk-reward calculations, scenario analysis
 * 3. EXECUTION: Position sizing, entry/exit strategies, dynamic management
 * 4. PSYCHOLOGY: Fear/greed detection, market regime recognition, contrarian signals
 * 5. LEARNING: Performance tracking, trade analysis, continuous improvement
 */

export interface MarketContext {
  symbol: string;
  timeframe: string;
  price: number;
  volume: number;
  trend: "bullish" | "bearish" | "sideways";
  volatility: "low" | "medium" | "high";
  momentum: number; // -100 to 100
  support: number[];
  resistance: number[];
  keyLevels: {
    level: number;
    type: "support" | "resistance" | "pivot";
    strength: number; // 0-100
    touched: number; // How many times tested
  }[];
}

export interface MultiTimeframeAnalysis {
  higher: {
    timeframe: string;
    trend: "bullish" | "bearish" | "sideways";
    signal: "buy" | "sell" | "neutral";
    strength: number; // 0-100
  };
  current: {
    timeframe: string;
    trend: "bullish" | "bearish" | "sideways";
    signal: "buy" | "sell" | "neutral";
    strength: number; // 0-100
  };
  lower: {
    timeframe: string;
    trend: "bullish" | "bearish" | "sideways";
    signal: "buy" | "sell" | "neutral";
    strength: number; // 0-100
  };
  alignment: number; // 0-100 (how aligned are the timeframes)
  confidence: number; // Overall confidence 0-100
}

export interface TradeSetup {
  type: "breakout" | "reversal" | "continuation" | "mean-reversion" | "momentum";
  quality: number; // 0-100 (setup quality score)
  timing: "early" | "optimal" | "late";
  confluence: string[]; // List of confirming factors
  risks: string[]; // List of risk factors
  invalidation: {
    price: number;
    reason: string;
  };
}

export interface RiskRewardAnalysis {
  entryPrice: number;
  stopLoss: number;
  targets: {
    price: number;
    probability: number; // % chance of reaching
    exitPercent: number; // % of position to exit
  }[];
  riskAmount: number; // $ at risk
  potentialReward: number; // $ potential gain
  riskRewardRatio: number; // Reward/Risk ratio
  winProbability: number; // % estimated win probability
  expectedValue: number; // (WinProb * Reward) - (LossProb * Risk)
  worthTaking: boolean;
}

export interface TradePlan {
  setup: TradeSetup;
  entry: {
    strategy: "market" | "limit" | "scaled";
    prices: number[];
    sizes: number[]; // % of total position
    conditions: string[];
  };
  exit: {
    stopLoss: number;
    targets: {
      price: number;
      size: number; // % to exit
      reason: string;
    }[];
    trailingStop: {
      enabled: boolean;
      activationPrice?: number;
      distance: number; // % or $
    };
  };
  positionSize: {
    usdValue: number;
    percentOfAccount: number;
    leverage: number;
    risk: number; // % of account
  };
  timeframe: string;
  expectedDuration: string; // "minutes", "hours", "days"
  scenarios: {
    bullCase: { probability: number; description: string };
    baseCase: { probability: number; description: string };
    bearCase: { probability: number; description: string };
  };
}

export interface MarketPsychology {
  fearGreedIndex: number; // 0-100 (0=extreme fear, 100=extreme greed)
  sentiment: "extreme-fear" | "fear" | "neutral" | "greed" | "extreme-greed";
  crowdBehavior: "panic-selling" | "cautious" | "neutral" | "fomo-buying" | "euphoric";
  contrarian: {
    signal: "buy" | "sell" | "neutral";
    strength: number; // 0-100
    reasoning: string;
  };
  marketRegime: "accumulation" | "markup" | "distribution" | "markdown";
  volumeProfile: "bullish" | "bearish" | "neutral";
  smartMoney: {
    activity: "buying" | "selling" | "neutral";
    confidence: number; // 0-100
  };
}

export interface ProfessionalReasoning {
  // STEP 1: Multi-Timeframe Analysis
  mtfAnalysis: MultiTimeframeAnalysis;
  
  // STEP 2: Market Context Understanding
  marketContext: MarketContext;
  
  // STEP 3: Trade Setup Identification
  tradeSetup: TradeSetup | null;
  
  // STEP 4: Risk-Reward Calculation
  riskReward: RiskRewardAnalysis | null;
  
  // STEP 5: Market Psychology
  psychology: MarketPsychology;
  
  // STEP 6: Trade Plan (if setup is valid)
  tradePlan: TradePlan | null;
  
  // STEP 7: Final Decision
  decision: {
    action: "enter-long" | "enter-short" | "wait" | "exit" | "scale-out";
    confidence: number; // 0-100
    reasoning: string[];
    warnings: string[];
    checklist: {
      item: string;
      passed: boolean;
      weight: number; // Importance 0-100
    }[];
  };
  
  // STEP 8: Execution Instructions
  execution: {
    priority: "immediate" | "patient" | "conditional";
    method: "market" | "limit" | "twap" | "iceberg";
    urgency: number; // 0-100
    notes: string[];
  };
}

/**
 * Professional Trader Reasoning Engine
 */
export class ProfessionalTraderBrain {
  
  /**
   * MAIN REASONING FUNCTION
   * Analyzes market like a professional trader and produces detailed trade plan
   */
  async reason(
    marketData: any,
    agentSignals: any[],
    accountBalance: number
  ): Promise<ProfessionalReasoning> {
    
    // STEP 1: Multi-Timeframe Analysis (Higher TF = Trend, Current TF = Trade, Lower TF = Timing)
    const mtfAnalysis = this.analyzeMultiTimeframe(marketData, agentSignals);
    
    // STEP 2: Market Context (Where are we in the bigger picture?)
    const marketContext = this.buildMarketContext(marketData);
    
    // STEP 3: Identify Trade Setup (Is there a high-quality setup forming?)
    const tradeSetup = this.identifyTradeSetup(marketContext, mtfAnalysis, agentSignals);
    
    // STEP 4: Calculate Risk-Reward (Is it worth taking?)
    const riskReward = tradeSetup 
      ? this.calculateRiskReward(tradeSetup, marketContext, accountBalance)
      : null;
    
    // STEP 5: Market Psychology (What is the crowd doing? Should we do opposite?)
    const psychology = this.analyzeMarketPsychology(marketData, agentSignals);
    
    // STEP 6: Create Trade Plan (How exactly will we execute?)
    const tradePlan = (tradeSetup && riskReward?.worthTaking)
      ? this.createTradePlan(tradeSetup, riskReward, marketContext, accountBalance)
      : null;
    
    // STEP 7: Make Final Decision (Trade checklist validation)
    const decision = this.makeFinalDecision(
      mtfAnalysis,
      tradeSetup,
      riskReward,
      psychology,
      tradePlan
    );
    
    // STEP 8: Execution Instructions (How to enter the market)
    const execution = this.planExecution(decision, tradePlan, marketContext);
    
    return {
      mtfAnalysis,
      marketContext,
      tradeSetup,
      riskReward,
      psychology,
      tradePlan,
      decision,
      execution
    };
  }

  /**
   * STEP 1: Multi-Timeframe Analysis
   * Professional traders always check higher and lower timeframes
   */
  private analyzeMultiTimeframe(
    marketData: any,
    agentSignals: any[]
  ): MultiTimeframeAnalysis {
    
    // Simulate higher timeframe (4H if current is 1H)
    const higherTF = {
      timeframe: "4h",
      trend: this.detectTrend(marketData, "higher"),
      signal: this.getTimeframeSignal(agentSignals, "higher"),
      strength: this.calculateSignalStrength(agentSignals, "higher")
    };
    
    // Current timeframe (1H)
    const currentTF = {
      timeframe: "1h",
      trend: this.detectTrend(marketData, "current"),
      signal: this.getTimeframeSignal(agentSignals, "current"),
      strength: this.calculateSignalStrength(agentSignals, "current")
    };
    
    // Lower timeframe (15m)
    const lowerTF = {
      timeframe: "15m",
      trend: this.detectTrend(marketData, "lower"),
      signal: this.getTimeframeSignal(agentSignals, "lower"),
      strength: this.calculateSignalStrength(agentSignals, "lower")
    };
    
    // Calculate alignment (all timeframes pointing same direction = high confidence)
    const alignment = this.calculateTimeframeAlignment(higherTF, currentTF, lowerTF);
    
    // Overall confidence based on alignment
    const confidence = alignment > 80 
      ? 90 
      : alignment > 60 
      ? 70 
      : alignment > 40 
      ? 50 
      : 30;
    
    return {
      higher: higherTF,
      current: currentTF,
      lower: lowerTF,
      alignment,
      confidence
    };
  }

  /**
   * STEP 2: Build Market Context
   * Understanding where we are in the market structure
   */
  private buildMarketContext(marketData: any): MarketContext {
    const price = marketData.close || marketData.price || 0;
    const volume = marketData.volume || 0;
    
    // Detect trend from price action
    const trend = this.detectTrendDirection(marketData);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(marketData);
    
    // Calculate momentum
    const momentum = this.calculateMomentum(marketData);
    
    // Identify key support and resistance levels
    const keyLevels = this.identifyKeyLevels(marketData);
    
    return {
      symbol: marketData.symbol || "BTCUSDT",
      timeframe: marketData.timeframe || "1h",
      price,
      volume,
      trend,
      volatility,
      momentum,
      support: keyLevels.filter(l => l.type === "support").map(l => l.level),
      resistance: keyLevels.filter(l => l.type === "resistance").map(l => l.level),
      keyLevels
    };
  }

  /**
   * STEP 3: Identify Trade Setup
   * Professional traders only trade high-quality setups
   */
  private identifyTradeSetup(
    context: MarketContext,
    mtf: MultiTimeframeAnalysis,
    signals: any[]
  ): TradeSetup | null {
    
    // Check if there's enough confluence
    const confluence = this.findConfluence(context, mtf, signals);
    
    if (confluence.length < 3) {
      return null; // Not enough confluence for a quality setup
    }
    
    // Determine setup type
    const setupType = this.determineSetupType(context, mtf, signals);
    
    // Calculate setup quality (0-100)
    const quality = this.calculateSetupQuality(confluence, mtf, context);
    
    // Professional traders only take A+ setups (quality > 70)
    if (quality < 70) {
      return null;
    }
    
    // Determine timing
    const timing = this.determineSetupTiming(context, mtf);
    
    // Identify risks
    const risks = this.identifySetupRisks(context, mtf, setupType);
    
    // Set invalidation point (where we know we're wrong)
    const invalidation = this.setInvalidationPoint(setupType, context);
    
    return {
      type: setupType,
      quality,
      timing,
      confluence,
      risks,
      invalidation
    };
  }

  /**
   * STEP 4: Calculate Risk-Reward
   * Professional traders calculate exact R:R before entering
   */
  private calculateRiskReward(
    setup: TradeSetup,
    context: MarketContext,
    accountBalance: number
  ): RiskRewardAnalysis {
    
    const entryPrice = context.price;
    const stopLoss = setup.invalidation.price;
    
    // Calculate targets based on setup type
    const targets = this.calculateTargets(setup, context);
    
    // Calculate risk amount (1-2% of account)
    const riskPercent = setup.quality > 85 ? 2.0 : 1.5; // Risk more on better setups
    const riskAmount = accountBalance * (riskPercent / 100);
    
    // Calculate potential reward (average of all targets)
    const avgTarget = targets.reduce((sum, t) => sum + t.price, 0) / targets.length;
    const potentialReward = Math.abs(avgTarget - entryPrice) * (riskAmount / Math.abs(stopLoss - entryPrice));
    
    // Calculate R:R ratio
    const riskRewardRatio = potentialReward / riskAmount;
    
    // Estimate win probability based on setup quality and market conditions
    const winProbability = this.estimateWinProbability(setup, context);
    
    // Calculate expected value (Kelly Criterion-inspired)
    const lossProb = 100 - winProbability;
    const expectedValue = (winProbability / 100 * potentialReward) - (lossProb / 100 * riskAmount);
    
    // Professional rule: Only take trades with R:R > 2 and positive EV
    const worthTaking = riskRewardRatio >= 2.0 && expectedValue > 0;
    
    return {
      entryPrice,
      stopLoss,
      targets,
      riskAmount,
      potentialReward,
      riskRewardRatio,
      winProbability,
      expectedValue,
      worthTaking
    };
  }

  /**
   * STEP 5: Analyze Market Psychology
   * Professional traders read crowd emotions and often do the opposite
   */
  private analyzeMarketPsychology(
    marketData: any,
    signals: any[]
  ): MarketPsychology {
    
    // Calculate fear/greed from signals and price action
    const fearGreedIndex = this.calculateFearGreed(marketData, signals);
    
    // Determine sentiment
    const sentiment = fearGreedIndex < 20 
      ? "extreme-fear"
      : fearGreedIndex < 40
      ? "fear"
      : fearGreedIndex < 60
      ? "neutral"
      : fearGreedIndex < 80
      ? "greed"
      : "extreme-greed";
    
    // Analyze crowd behavior
    const crowdBehavior = this.analyzeCrowdBehavior(marketData, signals);
    
    // Contrarian signal (buy fear, sell greed)
    const contrarian = this.generateContrarianSignal(fearGreedIndex, crowdBehavior);
    
    // Identify market regime (Wyckoff Method)
    const marketRegime = this.identifyMarketRegime(marketData, signals);
    
    // Volume profile analysis
    const volumeProfile = this.analyzeVolumeProfile(marketData);
    
    // Smart money tracking
    const smartMoney = this.trackSmartMoney(marketData, signals);
    
    return {
      fearGreedIndex,
      sentiment,
      crowdBehavior,
      contrarian,
      marketRegime,
      volumeProfile,
      smartMoney
    };
  }

  /**
   * STEP 6: Create Detailed Trade Plan
   * Professional traders plan every detail before entering
   */
  private createTradePlan(
    setup: TradeSetup,
    rr: RiskRewardAnalysis,
    context: MarketContext,
    accountBalance: number
  ): TradePlan {
    
    // Entry strategy
    const entry = {
      strategy: setup.timing === "optimal" ? "limit" as const : "scaled" as const,
      prices: this.calculateEntryPrices(context.price, setup),
      sizes: this.calculateEntrySizes(setup.timing),
      conditions: this.defineEntryConditions(setup, context)
    };
    
    // Exit strategy
    const exit = {
      stopLoss: rr.stopLoss,
      targets: rr.targets.map((t, i) => ({
        price: t.price,
        size: t.exitPercent,
        reason: i === 0 ? "Secure profit" : i === rr.targets.length - 1 ? "Full target" : "Scale out"
      })),
      trailingStop: {
        enabled: setup.type === "momentum" || setup.type === "breakout",
        activationPrice: rr.targets[0]?.price,
        distance: 2.0 // 2% trailing stop
      }
    };
    
    // Position sizing
    const positionSize = {
      usdValue: rr.riskAmount / (Math.abs(context.price - rr.stopLoss) / context.price),
      percentOfAccount: (rr.riskAmount / accountBalance) * 100,
      leverage: this.calculateOptimalLeverage(setup, rr),
      risk: (rr.riskAmount / accountBalance) * 100
    };
    
    // Expected duration
    const expectedDuration = this.estimateTradeDuration(setup.type, context.timeframe);
    
    // Scenario analysis
    const scenarios = this.analyzeScenarios(setup, context, rr);
    
    return {
      setup,
      entry,
      exit,
      positionSize,
      timeframe: context.timeframe,
      expectedDuration,
      scenarios
    };
  }

  /**
   * STEP 7: Make Final Decision
   * Run through professional trader's checklist
   */
  private makeFinalDecision(
    mtf: MultiTimeframeAnalysis,
    setup: TradeSetup | null,
    rr: RiskRewardAnalysis | null,
    psych: MarketPsychology,
    plan: TradePlan | null
  ): ProfessionalReasoning["decision"] {
    
    // Professional trader's checklist
    const checklist = [
      {
        item: "Multi-timeframe alignment",
        passed: mtf.alignment > 60,
        weight: 90
      },
      {
        item: "High-quality setup identified",
        passed: setup !== null && setup.quality > 70,
        weight: 100
      },
      {
        item: "Risk-reward ratio >= 2:1",
        passed: rr !== null && rr.riskRewardRatio >= 2.0,
        weight: 95
      },
      {
        item: "Positive expected value",
        passed: rr !== null && rr.expectedValue > 0,
        weight: 85
      },
      {
        item: "Setup timing is optimal",
        passed: setup !== null && setup.timing !== "late",
        weight: 70
      },
      {
        item: "Market psychology favorable",
        passed: psych.sentiment !== "extreme-greed" && psych.sentiment !== "extreme-fear",
        weight: 60
      },
      {
        item: "Low confluence of risks",
        passed: setup !== null && setup.risks.length < 3,
        weight: 75
      },
      {
        item: "Smart money aligned",
        passed: psych.smartMoney.confidence > 60,
        weight: 65
      }
    ];
    
    // Calculate weighted score
    const totalWeight = checklist.reduce((sum, item) => sum + item.weight, 0);
    const passedWeight = checklist
      .filter(item => item.passed)
      .reduce((sum, item) => sum + item.weight, 0);
    const confidence = Math.round((passedWeight / totalWeight) * 100);
    
    // Determine action
    let action: ProfessionalReasoning["decision"]["action"] = "wait";
    const reasoning: string[] = [];
    const warnings: string[] = [];
    
    if (setup && rr && plan) {
      const passedCritical = checklist
        .filter(item => item.weight >= 90 && item.passed)
        .length;
      
      if (passedCritical >= 2 && confidence >= 75) {
        const direction = mtf.current.signal === "buy" ? "enter-long" : "enter-short";
        action = direction;
        reasoning.push(`${setup.type} setup with ${setup.quality}% quality`);
        reasoning.push(`R:R ratio of ${rr.riskRewardRatio.toFixed(2)}:1`);
        reasoning.push(`${mtf.alignment}% timeframe alignment`);
        reasoning.push(`Win probability: ${rr.winProbability}%`);
      } else {
        action = "wait";
        reasoning.push("Setup quality insufficient for entry");
        checklist.filter(item => !item.passed && item.weight >= 70).forEach(item => {
          warnings.push(`Missing: ${item.item}`);
        });
      }
    } else {
      action = "wait";
      reasoning.push("No valid setup identified");
      if (!setup) warnings.push("No high-quality trade setup forming");
      if (!rr) warnings.push("Risk-reward not favorable");
    }
    
    return {
      action,
      confidence,
      reasoning,
      warnings,
      checklist
    };
  }

  /**
   * STEP 8: Plan Execution
   * How to enter the market optimally
   */
  private planExecution(
    decision: ProfessionalReasoning["decision"],
    plan: TradePlan | null,
    context: MarketContext
  ): ProfessionalReasoning["execution"] {
    
    if (decision.action === "wait") {
      return {
        priority: "patient",
        method: "limit",
        urgency: 0,
        notes: ["Wait for better setup", "Monitor for improved conditions"]
      };
    }
    
    const urgency = plan?.setup.timing === "optimal" ? 80 : 
                    plan?.setup.timing === "early" ? 40 : 60;
    
    const priority = urgency > 70 ? "immediate" : 
                     urgency > 40 ? "patient" : "conditional";
    
    const method = context.volatility === "high" ? "twap" :
                   plan?.entry.strategy === "scaled" ? "iceberg" : "limit";
    
    const notes: string[] = [];
    
    if (method === "twap") {
      notes.push("High volatility - use TWAP to get better average price");
    }
    if (method === "iceberg") {
      notes.push("Scale in across multiple levels to reduce risk");
    }
    if (priority === "immediate") {
      notes.push("Optimal timing - execute promptly");
    }
    if (context.volume < 1000000) {
      notes.push("Low volume - be patient with fills");
    }
    
    return {
      priority,
      method,
      urgency,
      notes
    };
  }

  // ============================================================================
  // HELPER METHODS (Simulated for now - replace with real calculations)
  // ============================================================================

  private detectTrend(marketData: any, tf: string): "bullish" | "bearish" | "sideways" {
    // Simplified - in reality, use moving averages, price structure, etc.
    const momentum = marketData.momentum || 0;
    if (momentum > 20) return "bullish";
    if (momentum < -20) return "bearish";
    return "sideways";
  }

  private getTimeframeSignal(signals: any[], tf: string): "buy" | "sell" | "neutral" {
    const avgScore = signals.reduce((sum, s) => sum + (s.score || 0), 0) / Math.max(signals.length, 1);
    if (avgScore > 0.3) return "buy";
    if (avgScore < -0.3) return "sell";
    return "neutral";
  }

  private calculateSignalStrength(signals: any[], tf: string): number {
    const avgConf = signals.reduce((sum, s) => sum + (s.confidence || 50), 0) / Math.max(signals.length, 1);
    return Math.min(100, Math.max(0, avgConf));
  }

  private calculateTimeframeAlignment(higher: any, current: any, lower: any): number {
    let alignment = 0;
    if (higher.signal === current.signal) alignment += 40;
    if (current.signal === lower.signal) alignment += 30;
    if (higher.signal === lower.signal) alignment += 30;
    return Math.min(100, alignment);
  }

  private detectTrendDirection(marketData: any): "bullish" | "bearish" | "sideways" {
    return this.detectTrend(marketData, "current");
  }

  private calculateVolatility(marketData: any): "low" | "medium" | "high" {
    const vol = marketData.volatility || 0;
    if (vol < 2) return "low";
    if (vol < 5) return "medium";
    return "high";
  }

  private calculateMomentum(marketData: any): number {
    return marketData.momentum || 0;
  }

  private identifyKeyLevels(marketData: any): MarketContext["keyLevels"] {
    // Simplified - in reality, identify swing highs/lows, volume nodes, etc.
    const price = marketData.close || 50000;
    return [
      { level: price * 0.98, type: "support", strength: 80, touched: 3 },
      { level: price * 1.02, type: "resistance", strength: 75, touched: 2 },
      { level: price, type: "pivot", strength: 60, touched: 5 }
    ];
  }

  private findConfluence(context: MarketContext, mtf: MultiTimeframeAnalysis, signals: any[]): string[] {
    const confluence: string[] = [];
    
    if (mtf.alignment > 70) confluence.push("Multi-timeframe alignment");
    if (signals.length >= 5) confluence.push("Multiple agent signals");
    if (context.momentum > 50) confluence.push("Strong momentum");
    if (context.volume > 1000000) confluence.push("High volume");
    
    // Check if price near key level
    const nearSupport = context.support.some(s => Math.abs(context.price - s) / context.price < 0.01);
    const nearResistance = context.resistance.some(r => Math.abs(context.price - r) / context.price < 0.01);
    
    if (nearSupport) confluence.push("Price at support");
    if (nearResistance) confluence.push("Price at resistance");
    
    return confluence;
  }

  private determineSetupType(context: MarketContext, mtf: MultiTimeframeAnalysis, signals: any[]): TradeSetup["type"] {
    if (context.trend === "sideways" && context.volatility === "low") return "mean-reversion";
    if (mtf.current.signal !== mtf.higher.signal) return "reversal";
    if (context.momentum > 60) return "momentum";
    if (mtf.alignment > 80) return "continuation";
    return "breakout";
  }

  private calculateSetupQuality(confluence: string[], mtf: MultiTimeframeAnalysis, context: MarketContext): number {
    let quality = 50; // Base
    quality += confluence.length * 8; // +8 per confluence factor
    quality += (mtf.alignment - 50) / 2; // Timeframe alignment bonus
    if (context.volatility === "low") quality += 5; // Lower risk
    if (context.volume > 1000000) quality += 10; // High volume confirmation
    return Math.min(100, Math.max(0, quality));
  }

  private determineSetupTiming(context: MarketContext, mtf: MultiTimeframeAnalysis): TradeSetup["timing"] {
    if (mtf.lower.signal === mtf.current.signal) return "optimal";
    if (mtf.lower.signal !== mtf.current.signal && mtf.higher.signal === mtf.current.signal) return "early";
    return "late";
  }

  private identifySetupRisks(context: MarketContext, mtf: MultiTimeframeAnalysis, type: TradeSetup["type"]): string[] {
    const risks: string[] = [];
    
    if (context.volatility === "high") risks.push("High volatility - wider stops needed");
    if (mtf.alignment < 50) risks.push("Timeframe divergence");
    if (context.volume < 500000) risks.push("Low volume - poor liquidity");
    if (type === "reversal") risks.push("Counter-trend trade - higher risk");
    
    return risks;
  }

  private setInvalidationPoint(type: TradeSetup["type"], context: MarketContext): TradeSetup["invalidation"] {
    let invalidationPrice = context.price;
    let reason = "Setup invalidated";
    
    // Find nearest key level
    const allLevels = [...context.support, ...context.resistance].sort((a, b) => 
      Math.abs(context.price - a) - Math.abs(context.price - b)
    );
    
    if (allLevels.length > 0) {
      invalidationPrice = allLevels[0];
      reason = `Price broke key level at $${invalidationPrice.toFixed(2)}`;
    }
    
    return { price: invalidationPrice, reason };
  }

  private calculateTargets(setup: TradeSetup, context: MarketContext): RiskRewardAnalysis["targets"] {
    const price = context.price;
    const direction = context.trend === "bullish" ? 1 : -1;
    
    // Calculate targets based on key levels and typical move sizes
    return [
      {
        price: price * (1 + direction * 0.02), // 2% move
        probability: 75,
        exitPercent: 33 // Exit 1/3 of position
      },
      {
        price: price * (1 + direction * 0.04), // 4% move
        probability: 50,
        exitPercent: 33 // Exit another 1/3
      },
      {
        price: price * (1 + direction * 0.06), // 6% move
        probability: 25,
        exitPercent: 34 // Exit final 1/3
      }
    ];
  }

  private estimateWinProbability(setup: TradeSetup, context: MarketContext): number {
    let baseProb = 50;
    
    // Adjust based on setup quality
    baseProb += (setup.quality - 50) / 2;
    
    // Adjust based on trend
    if (context.trend !== "sideways") baseProb += 10;
    
    // Adjust based on risks
    baseProb -= setup.risks.length * 5;
    
    return Math.min(85, Math.max(30, baseProb));
  }

  private calculateFearGreed(marketData: any, signals: any[]): number {
    // Simplified - in reality, use volume, price action, social sentiment, etc.
    const momentum = marketData.momentum || 0;
    return Math.min(100, Math.max(0, 50 + momentum));
  }

  private analyzeCrowdBehavior(marketData: any, signals: any[]): MarketPsychology["crowdBehavior"] {
    const fearGreed = this.calculateFearGreed(marketData, signals);
    if (fearGreed < 15) return "panic-selling";
    if (fearGreed < 35) return "cautious";
    if (fearGreed < 65) return "neutral";
    if (fearGreed < 85) return "fomo-buying";
    return "euphoric";
  }

  private generateContrarianSignal(fearGreed: number, crowd: MarketPsychology["crowdBehavior"]): MarketPsychology["contrarian"] {
    if (fearGreed < 20) {
      return {
        signal: "buy",
        strength: 90,
        reasoning: "Extreme fear - time to buy when others panic"
      };
    }
    if (fearGreed > 80) {
      return {
        signal: "sell",
        strength: 90,
        reasoning: "Extreme greed - time to sell when others are euphoric"
      };
    }
    return {
      signal: "neutral",
      strength: 50,
      reasoning: "No extreme sentiment"
    };
  }

  private identifyMarketRegime(marketData: any, signals: any[]): MarketPsychology["marketRegime"] {
    // Wyckoff Method: accumulation -> markup -> distribution -> markdown
    const trend = this.detectTrend(marketData, "current");
    const volume = marketData.volume || 0;
    
    if (trend === "sideways" && volume < 500000) return "accumulation";
    if (trend === "bullish" && volume > 1000000) return "markup";
    if (trend === "sideways" && volume > 1000000) return "distribution";
    return "markdown";
  }

  private analyzeVolumeProfile(marketData: any): MarketPsychology["volumeProfile"] {
    const volume = marketData.volume || 0;
    const avgVolume = marketData.avgVolume || volume;
    
    if (volume > avgVolume * 1.5) return "bullish";
    if (volume < avgVolume * 0.7) return "bearish";
    return "neutral";
  }

  private trackSmartMoney(marketData: any, signals: any[]): MarketPsychology["smartMoney"] {
    // Simplified - in reality, track order flow, large trades, etc.
    const volume = marketData.volume || 0;
    const trend = this.detectTrend(marketData, "current");
    
    return {
      activity: trend === "bullish" ? "buying" : trend === "bearish" ? "selling" : "neutral",
      confidence: volume > 1000000 ? 80 : 50
    };
  }

  private calculateEntryPrices(currentPrice: number, setup: TradeSetup): number[] {
    if (setup.timing === "optimal") {
      return [currentPrice]; // Single entry
    }
    // Scaled entry
    return [
      currentPrice * 0.995,
      currentPrice,
      currentPrice * 1.005
    ];
  }

  private calculateEntrySizes(timing: TradeSetup["timing"]): number[] {
    if (timing === "optimal") {
      return [100]; // Full position
    }
    // Scaled entry
    return [40, 30, 30]; // 40% -> 30% -> 30%
  }

  private defineEntryConditions(setup: TradeSetup, context: MarketContext): string[] {
    return [
      "Price confirmation on lower timeframe",
      "Volume spike on entry",
      `No break of invalidation level ($${setup.invalidation.price.toFixed(2)})`
    ];
  }

  private calculateOptimalLeverage(setup: TradeSetup, rr: RiskRewardAnalysis): number {
    // Conservative leverage based on setup quality
    if (setup.quality > 85) return 3;
    if (setup.quality > 75) return 2;
    return 1; // No leverage for lower quality setups
  }

  private estimateTradeDuration(type: TradeSetup["type"], timeframe: string): string {
    if (type === "momentum") return "hours";
    return "days";
  }

  private analyzeScenarios(setup: TradeSetup, context: MarketContext, rr: RiskRewardAnalysis): TradePlan["scenarios"] {
    return {
      bullCase: {
        probability: setup.type === "continuation" && context.trend === "bullish" ? 60 : 40,
        description: `Price reaches all targets, ${rr.riskRewardRatio.toFixed(1)}:1 R:R achieved`
      },
      baseCase: {
        probability: 50,
        description: `Price reaches first target, 1:1 R:R achieved`
      },
      bearCase: {
        probability: 100 - rr.winProbability,
        description: `Setup fails, stopped out at $${rr.stopLoss.toFixed(2)}`
      }
    };
  }
}

// Export singleton instance
export const professionalBrain = new ProfessionalTraderBrain();
