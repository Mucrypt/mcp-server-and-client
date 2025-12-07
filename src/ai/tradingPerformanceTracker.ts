/**
 * Trading Performance Tracker & Learning System
 * 
 * Professional traders continuously learn from their trades.
 * This module:
 * 1. Tracks all trades and their outcomes
 * 2. Analyzes winning vs losing trades
 * 3. Identifies optimal market conditions
 * 4. Adapts strategy based on performance
 * 5. Provides performance metrics and insights
 */

import { supabase } from "../core/supabase";

export interface TradeOutcome {
  id: string;
  symbol: string;
  direction: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: Date;
  exitTime: Date;
  pnl: number;
  pnlPercent: number;
  result: "win" | "loss" | "breakeven";
  setupType: string;
  setupQuality: number;
  timeframeAlignment: number;
  riskRewardRatio: number;
  marketConditions: {
    trend: string;
    volatility: string;
    volume: number;
    fearGreed: number;
    marketRegime: string;
  };
  exitReason: "take-profit" | "stop-loss" | "trailing-stop" | "manual" | "timeout";
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // %
  avgWin: number; // $
  avgLoss: number; // $
  largestWin: number;
  largestLoss: number;
  profitFactor: number; // Total wins / Total losses
  expectancy: number; // Average $ per trade
  sharpeRatio: number;
  maxDrawdown: number; // %
  totalPnL: number;
  roi: number; // %
  avgHoldTime: number; // hours
  bestSetupType: string;
  worstSetupType: string;
  optimalConditions: {
    trend: string;
    volatility: string;
    fearGreed: { min: number; max: number };
    timeOfDay: string;
  };
}

export interface TradingInsight {
  type: "strength" | "weakness" | "opportunity" | "recommendation";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  suggestedAction?: string;
}

export class TradingPerformanceTracker {
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  /**
   * Record a completed trade
   */
  async recordTrade(trade: TradeOutcome): Promise<void> {
    const { error } = await supabase.from("trade_history").insert({
      account_id: this.accountId,
      symbol: trade.symbol,
      direction: trade.direction,
      entry_price: trade.entryPrice,
      exit_price: trade.exitPrice,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      entry_time: trade.entryTime.toISOString(),
      exit_time: trade.exitTime.toISOString(),
      pnl: trade.pnl,
      pnl_percent: trade.pnlPercent,
      result: trade.result,
      setup_type: trade.setupType,
      setup_quality: trade.setupQuality,
      timeframe_alignment: trade.timeframeAlignment,
      risk_reward_ratio: trade.riskRewardRatio,
      market_conditions: trade.marketConditions,
      exit_reason: trade.exitReason
    });

    if (error) {
      console.error("Failed to record trade:", error.message);
    } else {
      console.log(`✅ Trade recorded: ${trade.result.toUpperCase()} - $${trade.pnl.toFixed(2)}`);
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async getPerformanceMetrics(days: number = 30): Promise<PerformanceMetrics> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: trades, error } = await supabase
      .from("trade_history")
      .select("*")
      .eq("account_id", this.accountId)
      .gte("exit_time", since.toISOString())
      .order("exit_time", { ascending: true });

    if (error || !trades || trades.length === 0) {
      return this.getEmptyMetrics();
    }

    // Basic metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.result === "win").length;
    const losingTrades = trades.filter(t => t.result === "loss").length;
    const breakevenTrades = trades.filter(t => t.result === "breakeven").length;
    const winRate = (winningTrades / totalTrades) * 100;

    // Profit metrics
    const wins = trades.filter(t => t.result === "win").map(t => t.pnl);
    const losses = trades.filter(t => t.result === "loss").map(t => Math.abs(t.pnl));
    
    const totalWins = wins.reduce((sum, w) => sum + w, 0);
    const totalLosses = losses.reduce((sum, l) => sum + l, 0);
    
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    
    const largestWin = wins.length > 0 ? Math.max(...wins) : 0;
    const largestLoss = losses.length > 0 ? Math.max(...losses) : 0;
    
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    const expectancy = (totalWins - totalLosses) / totalTrades;

    // Total P&L
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    
    // Sharpe Ratio (simplified)
    const returns = trades.map(t => t.pnl_percent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    for (const trade of trades) {
      runningPnL += trade.pnl;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = ((peak - runningPnL) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Average hold time
    const holdTimes = trades.map(t => {
      const entry = new Date(t.entry_time).getTime();
      const exit = new Date(t.exit_time).getTime();
      return (exit - entry) / (1000 * 60 * 60); // hours
    });
    const avgHoldTime = holdTimes.reduce((sum, h) => sum + h, 0) / holdTimes.length;

    // Best/worst setup types
    const setupPerformance = this.analyzeSetupPerformance(trades);
    const bestSetupType = setupPerformance[0]?.type || "unknown";
    const worstSetupType = setupPerformance[setupPerformance.length - 1]?.type || "unknown";

    // Optimal conditions
    const optimalConditions = this.findOptimalConditions(trades);

    // ROI (simplified - assuming $10,000 starting balance)
    const roi = (totalPnL / 10000) * 100;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      winRate,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
      sharpeRatio,
      maxDrawdown,
      totalPnL,
      roi,
      avgHoldTime,
      bestSetupType,
      worstSetupType,
      optimalConditions
    };
  }

  /**
   * Analyze performance by setup type
   */
  private analyzeSetupPerformance(trades: any[]): { type: string; winRate: number; avgPnL: number }[] {
    const setupTypes = [...new Set(trades.map(t => t.setup_type))];
    
    const performance = setupTypes.map(type => {
      const typeTrades = trades.filter(t => t.setup_type === type);
      const wins = typeTrades.filter(t => t.result === "win").length;
      const winRate = (wins / typeTrades.length) * 100;
      const avgPnL = typeTrades.reduce((sum, t) => sum + t.pnl, 0) / typeTrades.length;
      
      return { type, winRate, avgPnL };
    });

    // Sort by average P&L (best to worst)
    return performance.sort((a, b) => b.avgPnL - a.avgPnL);
  }

  /**
   * Find optimal market conditions for trading
   */
  private findOptimalConditions(trades: any[]): PerformanceMetrics["optimalConditions"] {
    const winningTrades = trades.filter(t => t.result === "win");
    
    if (winningTrades.length === 0) {
      return {
        trend: "unknown",
        volatility: "unknown",
        fearGreed: { min: 0, max: 100 },
        timeOfDay: "unknown"
      };
    }

    // Most common trend in winning trades
    const trends = winningTrades.map(t => t.market_conditions?.trend || "unknown");
    const trend = this.mostCommon(trends);

    // Most common volatility in winning trades
    const volatilities = winningTrades.map(t => t.market_conditions?.volatility || "unknown");
    const volatility = this.mostCommon(volatilities);

    // Fear/Greed range in winning trades
    const fearGreedValues = winningTrades
      .map(t => t.market_conditions?.fearGreed)
      .filter(v => v !== undefined);
    
    const fearGreed = fearGreedValues.length > 0
      ? {
          min: Math.min(...fearGreedValues),
          max: Math.max(...fearGreedValues)
        }
      : { min: 0, max: 100 };

    // Best time of day (simplified)
    const hours = winningTrades.map(t => new Date(t.entry_time).getHours());
    const avgHour = Math.round(hours.reduce((sum, h) => sum + h, 0) / hours.length);
    const timeOfDay = avgHour < 6 ? "night" : avgHour < 12 ? "morning" : avgHour < 18 ? "afternoon" : "evening";

    return { trend, volatility, fearGreed, timeOfDay };
  }

  /**
   * Generate actionable trading insights
   */
  async generateInsights(): Promise<TradingInsight[]> {
    const metrics = await this.getPerformanceMetrics(30);
    const insights: TradingInsight[] = [];

    // Win Rate Analysis
    if (metrics.winRate > 60) {
      insights.push({
        type: "strength",
        title: "Excellent Win Rate",
        description: `Your win rate of ${metrics.winRate.toFixed(1)}% is above professional level (>60%). Keep following your current strategy.`,
        impact: "high",
        actionable: true,
        suggestedAction: "Increase position sizes slightly on high-confidence setups"
      });
    } else if (metrics.winRate < 45) {
      insights.push({
        type: "weakness",
        title: "Low Win Rate Detected",
        description: `Win rate of ${metrics.winRate.toFixed(1)}% is below optimal. Review losing trades and tighten entry criteria.`,
        impact: "high",
        actionable: true,
        suggestedAction: "Only take A+ setups (quality > 85%) until win rate improves"
      });
    }

    // Profit Factor Analysis
    if (metrics.profitFactor > 2) {
      insights.push({
        type: "strength",
        title: "Strong Profit Factor",
        description: `Profit factor of ${metrics.profitFactor.toFixed(2)} shows excellent risk management. Average wins are significantly larger than losses.`,
        impact: "high",
        actionable: false
      });
    } else if (metrics.profitFactor < 1.5) {
      insights.push({
        type: "weakness",
        title: "Improve Risk-Reward",
        description: `Profit factor of ${metrics.profitFactor.toFixed(2)} needs improvement. Let winners run longer and cut losses faster.`,
        impact: "high",
        actionable: true,
        suggestedAction: "Use trailing stops on profitable trades to capture larger moves"
      });
    }

    // Setup Type Analysis
    if (metrics.bestSetupType !== "unknown") {
      insights.push({
        type: "opportunity",
        title: "Best Performing Setup",
        description: `Your ${metrics.bestSetupType} setups perform best. Focus more on these patterns.`,
        impact: "medium",
        actionable: true,
        suggestedAction: `Increase confidence threshold for non-${metrics.bestSetupType} setups`
      });
    }

    // Market Conditions
    if (metrics.optimalConditions.trend !== "unknown") {
      insights.push({
        type: "recommendation",
        title: "Optimal Market Conditions",
        description: `You perform best in ${metrics.optimalConditions.trend} trends with ${metrics.optimalConditions.volatility} volatility.`,
        impact: "medium",
        actionable: true,
        suggestedAction: "Reduce position sizes or skip trades outside these conditions"
      });
    }

    // Expectancy Analysis
    if (metrics.expectancy > 0) {
      insights.push({
        type: "strength",
        title: "Positive Expectancy",
        description: `Average profit of $${metrics.expectancy.toFixed(2)} per trade. Your strategy has a mathematical edge.`,
        impact: "high",
        actionable: true,
        suggestedAction: "Scale up trading volume to maximize edge"
      });
    } else {
      insights.push({
        type: "weakness",
        title: "Negative Expectancy",
        description: `Average loss of $${Math.abs(metrics.expectancy).toFixed(2)} per trade. Strategy needs revision.`,
        impact: "high",
        actionable: true,
        suggestedAction: "Pause trading and analyze last 20 trades for common mistakes"
      });
    }

    // Max Drawdown
    if (metrics.maxDrawdown > 20) {
      insights.push({
        type: "weakness",
        title: "High Drawdown Risk",
        description: `Max drawdown of ${metrics.maxDrawdown.toFixed(1)}% is concerning. Reduce position sizes.`,
        impact: "high",
        actionable: true,
        suggestedAction: "Cut position sizes in half until drawdown reduces below 15%"
      });
    }

    // Average Hold Time
    if (metrics.avgHoldTime < 1) {
      insights.push({
        type: "recommendation",
        title: "Very Short Hold Times",
        description: `Average hold time of ${(metrics.avgHoldTime * 60).toFixed(0)} minutes suggests scalping. Consider longer timeframes for less stress.`,
        impact: "low",
        actionable: true,
        suggestedAction: "Test 4H timeframe setups for better risk-reward"
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Analyze losing trades to find patterns
   */
  async analyzeLosingTrades(limit: number = 20): Promise<{
    commonMistakes: string[];
    avgLossSize: number;
    mostCommonExitReason: string;
    worstMarketConditions: any;
  }> {
    const { data: losses, error } = await supabase
      .from("trade_history")
      .select("*")
      .eq("account_id", this.accountId)
      .eq("result", "loss")
      .order("exit_time", { ascending: false })
      .limit(limit);

    if (error || !losses || losses.length === 0) {
      return {
        commonMistakes: ["Not enough data"],
        avgLossSize: 0,
        mostCommonExitReason: "unknown",
        worstMarketConditions: {}
      };
    }

    const commonMistakes: string[] = [];
    
    // Analyze setup quality of losses
    const lowQualitySetups = losses.filter(t => t.setup_quality < 70).length;
    if (lowQualitySetups > losses.length * 0.5) {
      commonMistakes.push(`${((lowQualitySetups / losses.length) * 100).toFixed(0)}% of losses had low-quality setups (<70%)`);
    }

    // Analyze timeframe alignment
    const poorAlignment = losses.filter(t => t.timeframe_alignment < 50).length;
    if (poorAlignment > losses.length * 0.5) {
      commonMistakes.push(`${((poorAlignment / losses.length) * 100).toFixed(0)}% of losses had poor timeframe alignment (<50%)`);
    }

    // Analyze risk-reward ratio
    const poorRR = losses.filter(t => t.risk_reward_ratio < 2).length;
    if (poorRR > losses.length * 0.5) {
      commonMistakes.push(`${((poorRR / losses.length) * 100).toFixed(0)}% of losses had poor risk-reward (<2:1)`);
    }

    const avgLossSize = losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses.length;
    
    const exitReasons = losses.map(t => t.exit_reason);
    const mostCommonExitReason = this.mostCommon(exitReasons);

    const worstMarketConditions = this.findWorstConditions(losses);

    return {
      commonMistakes,
      avgLossSize,
      mostCommonExitReason,
      worstMarketConditions
    };
  }

  /**
   * Get trading journal summary
   */
  async getJournalSummary(days: number = 7): Promise<string> {
    const metrics = await this.getPerformanceMetrics(days);
    const insights = await this.generateInsights();
    const lossAnalysis = await this.analyzeLosingTrades(10);

    let summary = `📊 TRADING JOURNAL (Last ${days} days)\n\n`;
    
    summary += `PERFORMANCE METRICS:\n`;
    summary += `├─ Total Trades: ${metrics.totalTrades}\n`;
    summary += `├─ Win Rate: ${metrics.winRate.toFixed(1)}% (${metrics.winningTrades}W / ${metrics.losingTrades}L)\n`;
    summary += `├─ Profit Factor: ${metrics.profitFactor.toFixed(2)}\n`;
    summary += `├─ Total P&L: $${metrics.totalPnL.toFixed(2)}\n`;
    summary += `├─ ROI: ${metrics.roi.toFixed(2)}%\n`;
    summary += `├─ Avg Win: $${metrics.avgWin.toFixed(2)}\n`;
    summary += `├─ Avg Loss: $${metrics.avgLoss.toFixed(2)}\n`;
    summary += `├─ Expectancy: $${metrics.expectancy.toFixed(2)}\n`;
    summary += `├─ Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%\n`;
    summary += `└─ Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}\n\n`;

    summary += `OPTIMAL CONDITIONS:\n`;
    summary += `├─ Best Setup: ${metrics.bestSetupType}\n`;
    summary += `├─ Trend: ${metrics.optimalConditions.trend}\n`;
    summary += `├─ Volatility: ${metrics.optimalConditions.volatility}\n`;
    summary += `├─ Fear/Greed: ${metrics.optimalConditions.fearGreed.min}-${metrics.optimalConditions.fearGreed.max}\n`;
    summary += `└─ Time: ${metrics.optimalConditions.timeOfDay}\n\n`;

    if (insights.length > 0) {
      summary += `KEY INSIGHTS:\n`;
      insights.slice(0, 5).forEach((insight, i) => {
        const icon = insight.type === "strength" ? "💪" : 
                    insight.type === "weakness" ? "⚠️" : 
                    insight.type === "opportunity" ? "🎯" : "💡";
        summary += `${icon} ${insight.title}\n`;
        summary += `   ${insight.description}\n`;
        if (insight.suggestedAction) {
          summary += `   → ${insight.suggestedAction}\n`;
        }
        summary += `\n`;
      });
    }

    if (lossAnalysis.commonMistakes.length > 0) {
      summary += `COMMON MISTAKES:\n`;
      lossAnalysis.commonMistakes.forEach(mistake => {
        summary += `❌ ${mistake}\n`;
      });
    }

    return summary;
  }

  // Helper methods
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalPnL: 0,
      roi: 0,
      avgHoldTime: 0,
      bestSetupType: "unknown",
      worstSetupType: "unknown",
      optimalConditions: {
        trend: "unknown",
        volatility: "unknown",
        fearGreed: { min: 0, max: 100 },
        timeOfDay: "unknown"
      }
    };
  }

  private mostCommon<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    
    let maxCount = 0;
    let mostCommonItem = arr[0];
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonItem = item;
      }
    });
    
    return mostCommonItem;
  }

  private findWorstConditions(trades: any[]): any {
    const conditions = trades.map(t => t.market_conditions).filter(Boolean);
    
    if (conditions.length === 0) return {};

    return {
      trend: this.mostCommon(conditions.map(c => c.trend)),
      volatility: this.mostCommon(conditions.map(c => c.volatility)),
      avgFearGreed: conditions.reduce((sum, c) => sum + (c.fearGreed || 50), 0) / conditions.length
    };
  }
}

// Export singleton
export const performanceTracker = (accountId: string) => new TradingPerformanceTracker(accountId);
