"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { PerformanceMetrics, PerformanceInsight, TradingJournalEntry } from "@/lib/types";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  CheckCircle2,
  Lightbulb,
  BookOpen,
  BarChart3,
  Trophy,
  AlertTriangle
} from "lucide-react";

export function ProfessionalPerformance({ accountId }: { accountId: string }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [journal, setJournal] = useState<{ entries: TradingJournalEntry[]; summary: any } | null>(null);
  const [lossAnalysis, setLossAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [accountId, timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [metricsRes, insightsRes, journalRes, lossesRes] = await Promise.all([
        api.getPerformanceMetrics(accountId, timeRange),
        api.getPerformanceInsights(accountId),
        api.getTradingJournal(accountId, 7),
        api.analyzeLosingTrades(accountId, 20)
      ]);

      setMetrics(metricsRes);
      setInsights(insightsRes);
      setJournal(journalRes);
      setLossAnalysis(lossesRes);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      </Card>
    );
  }

  if (!metrics || metrics.totalTrades === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Trading Data Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete at least 10 trades to see professional performance analytics
          </p>
          <Badge variant="outline">
            {metrics?.totalTrades || 0} trades recorded
          </Badge>
        </div>
      </Card>
    );
  }

  const isPerforming = metrics.winRate >= 60 && metrics.profitFactor >= 2.0;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Win Rate</span>
            {metrics.winRate >= 60 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${metrics.winRate >= 60 ? 'text-emerald' : 'text-yellow-500'}`}>
              {metrics.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full ${metrics.winRate >= 60 ? 'bg-emerald' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(metrics.winRate, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.winningTrades}W / {metrics.losingTrades}L
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profit Factor</span>
            <Trophy className="h-4 w-4 text-gold" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${metrics.profitFactor >= 2.0 ? 'text-gold' : 'text-muted-foreground'}`}>
              {metrics.profitFactor.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Target: 2.5+
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Net Profit</span>
            {metrics.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald' : 'text-red-500'}`}>
              €{Math.abs(metrics.netProfit).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Avg €{metrics.expectancy.toFixed(2)}/trade
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sharpe Ratio</span>
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {metrics.sharpeRatio.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.sharpeRatio >= 2.0 ? "Excellent" : metrics.sharpeRatio >= 1.0 ? "Good" : "Needs work"}
          </p>
        </Card>
      </div>

      {/* Performance Status Banner */}
      {isPerforming ? (
        <Card className="p-4 bg-emerald/10 border border-emerald/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-emerald">Professional Performance 🎯</div>
              <div className="text-sm text-muted-foreground mt-1">
                Your AI is performing at professional trader level. Win rate {metrics.winRate.toFixed(1)}%, 
                profit factor {metrics.profitFactor.toFixed(2)}. Keep following the system!
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-yellow-500">Building Track Record</div>
              <div className="text-sm text-muted-foreground mt-1">
                Complete more trades to establish professional performance metrics. 
                Target: 60%+ win rate, 2.0+ profit factor.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="analysis">Loss Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <Card className="p-6">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground">PROFITABILITY</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Trades</span>
                  <span className="font-semibold">{metrics.totalTrades}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Win</span>
                  <span className="font-semibold text-emerald">€{metrics.averageWin.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Loss</span>
                  <span className="font-semibold text-red-500">€{Math.abs(metrics.averageLoss).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Largest Win</span>
                  <span className="font-semibold text-emerald">€{metrics.largestWin.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Largest Loss</span>
                  <span className="font-semibold text-red-500">€{Math.abs(metrics.largestLoss).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm font-medium">Expectancy</span>
                  <span className="font-bold text-gold">€{metrics.expectancy.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Right Column */}
            <Card className="p-6">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground">RISK MANAGEMENT</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Max Drawdown</span>
                  <span className="font-semibold text-red-500">{metrics.maxDrawdown.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recovery Factor</span>
                  <span className="font-semibold">{metrics.recoveryFactor.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consecutive Wins</span>
                  <span className="font-semibold text-emerald">{metrics.consecutiveWins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consecutive Losses</span>
                  <span className="font-semibold text-red-500">{metrics.consecutiveLosses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Hold Time</span>
                  <span className="font-semibold">{metrics.avgHoldingTime.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm font-medium">Sharpe Ratio</span>
                  <span className="font-bold text-gold">{metrics.sharpeRatio.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Best Setups */}
            {metrics.bestSetupType && (
              <Card className="p-6 md:col-span-2 bg-gradient-to-br from-emerald/10 to-emerald/5">
                <h4 className="text-sm font-semibold mb-4 text-emerald">🎯 BEST PERFORMING SETUPS</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Best Setup</div>
                    <div className="font-semibold">{metrics.bestSetupType}</div>
                  </div>
                  {metrics.bestTimeOfDay && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Best Time</div>
                      <div className="font-semibold">{metrics.bestTimeOfDay}</div>
                    </div>
                  )}
                  {metrics.optimalRiskReward && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Optimal R:R</div>
                      <div className="font-semibold">{metrics.optimalRiskReward.toFixed(2)}:1</div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 mt-4">
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight) => {
                const Icon = insight.insight_type === "strength" ? CheckCircle2 :
                           insight.insight_type === "weakness" ? AlertCircle :
                           insight.insight_type === "opportunity" ? TrendingUp : Lightbulb;
                
                const colorClass = insight.insight_type === "strength" ? "text-emerald" :
                                 insight.insight_type === "weakness" ? "text-red-500" :
                                 insight.insight_type === "opportunity" ? "text-gold" : "text-primary";
                
                const bgClass = insight.insight_type === "strength" ? "bg-emerald/10 border-emerald/20" :
                               insight.insight_type === "weakness" ? "bg-red-500/10 border-red-500/20" :
                               insight.insight_type === "opportunity" ? "bg-gold/10 border-gold/20" : "bg-primary/10 border-primary/20";

                return (
                  <Card key={insight.id} className={`p-4 ${bgClass}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${colorClass} mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold ${colorClass}`}>{insight.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {insight.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.actionable && (
                          <div className="mt-2 text-xs font-medium text-muted-foreground">
                            ✓ Actionable recommendation
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  AI insights will appear after analyzing your trading patterns
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="journal" className="space-y-4 mt-4">
          {journal && journal.entries.length > 0 ? (
            <div className="space-y-3">
              {/* Summary */}
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                <h4 className="text-sm font-semibold mb-3">7-Day Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
                    <div className="text-lg font-bold">{journal.summary.totalTrades}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                    <div className="text-lg font-bold text-emerald">{journal.summary.winRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
                    <div className={`text-lg font-bold ${journal.summary.totalPnL >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                      €{journal.summary.totalPnL.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Best Day</div>
                    <div className="text-lg font-bold text-gold">€{journal.summary.bestDay.toFixed(2)}</div>
                  </div>
                </div>
              </Card>

              {/* Daily Entries */}
              {journal.entries.map((entry) => (
                <Card key={entry.date} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    <span className={`font-bold ${entry.dailyPnL >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                      €{entry.dailyPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{entry.trades} trades</span>
                    <span className="text-emerald">{entry.wins}W</span>
                    <span className="text-red-500">{entry.losses}L</span>
                    <span className="ml-auto">{entry.winRate.toFixed(0)}% win rate</span>
                  </div>
                  {entry.notes && entry.notes.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      {entry.notes.map((note, i) => (
                        <p key={i} className="text-xs text-muted-foreground italic">• {note}</p>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Your trading journal will appear here after completing trades
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4 mt-4">
          {lossAnalysis && lossAnalysis.losses.length > 0 ? (
            <div className="space-y-4">
              {/* Loss Patterns Summary */}
              <Card className="p-4 bg-red-500/10 border-red-500/20">
                <h4 className="text-sm font-semibold mb-3 text-red-500">Loss Analysis Summary</h4>
                <div className="space-y-2 text-sm">
                  {lossAnalysis.commonPatterns.map((pattern: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>{pattern}</span>
                    </div>
                  ))}
                </div>
                {lossAnalysis.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-500/20">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">RECOMMENDATIONS</div>
                    {lossAnalysis.recommendations.map((rec: string, i: number) => (
                      <div key={i} className="text-sm text-muted-foreground mb-1">✓ {rec}</div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Individual Losing Trades */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Recent Losing Trades</h4>
                {lossAnalysis.losses.slice(0, 10).map((trade: any) => (
                  <Card key={trade.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">{trade.symbol}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(trade.exit_time).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-bold text-red-500">
                        -€{Math.abs(trade.profit_loss).toFixed(2)}
                      </span>
                    </div>
                    {trade.setup_type && (
                      <div className="text-xs text-muted-foreground">
                        Setup: {trade.setup_type} | Hold: {trade.holding_time_hours?.toFixed(1)}h
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No losing trades to analyze yet
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Time Range Selector */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={timeRange === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange(7)}
        >
          7 Days
        </Button>
        <Button
          variant={timeRange === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange(30)}
        >
          30 Days
        </Button>
        <Button
          variant={timeRange === 90 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange(90)}
        >
          90 Days
        </Button>
      </div>
    </div>
  );
}
