"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountEquityChart } from "@/components/charts/AccountEquityChart";
import { AgentPipelineGraph } from "@/components/pipeline/AgentPipelineGraph";
import { PipelineRunTable } from "@/components/pipeline/PipelineRunTable";
import { AIBrainControlPanel } from "@/components/brain/AIBrainControlPanel";
import { MarketAnalysis } from "@/components/brain/MarketAnalysis";
import { ProfessionalPerformance } from "@/components/brain/ProfessionalPerformance";
import { api } from "@/lib/api";
import { Activity, DollarSign, TrendingUp, TrendingDown, Brain } from "lucide-react";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [latestSignal, setLatestSignal] = useState<any>(null);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enhanced GSAP animations
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".dashboard-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
        }
      );
    }

    // Fetch data
    const fetchData = async () => {
      try {
        const defaultAccountId = process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || "1";
        
        const [healthRes, accountsRes, signalsRes, runsRes, metricsRes] = await Promise.all([
          api.health(),
          api.getAccounts(),
          api.getTradeSignals(),
          api.getPipelineRuns(),
          api.getPerformanceMetrics(defaultAccountId, 30).catch(() => null),
        ]);

        setHealth(healthRes);
        
        const account = accountsRes.find((a: any) => a.id === defaultAccountId);
        setAccountData(account);

        if (signalsRes.length > 0) {
          setLatestSignal(signalsRes[0]);
          setRecentSignals(signalsRes.slice(0, 5));
        }

        if (runsRes.length > 0) {
          setLatestRun(runsRes[0]);
        }

        if (metricsRes) {
          setPerformanceMetrics(metricsRes);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, []);

  const engineStatusColor = health?.status === "ok" ? "text-emerald-400" : "text-red-400";
  const equityChange = accountData?.current_balance && accountData?.starting_balance
    ? ((accountData.current_balance - accountData.starting_balance) / accountData.starting_balance * 100).toFixed(2)
    : "0.00";
  const isPositive = parseFloat(equityChange) >= 0;

  return (
    <div className="space-y-6" ref={cardsRef}>
      {/* Top Row - Status Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="dashboard-card group border-border bg-card p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Engine Status</p>
              <p className={`mt-2 text-3xl font-bold bg-gradient-to-r ${health?.status === "ok" ? "from-accent to-primary" : "from-destructive to-destructive/70"} bg-clip-text text-transparent`}>
                {health?.status?.toUpperCase() || "CHECKING"}
              </p>
            </div>
            <Activity className={`h-12 w-12 transition-all duration-300 ${health?.status === "ok" ? "text-accent drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] group-hover:scale-110" : "text-destructive"}`} />
          </div>
          {health?.agent_count && (
            <p className="mt-4 text-sm text-muted-foreground font-medium">
              {health.agent_count} agents active
            </p>
          )}
        </Card>

        <Card className="dashboard-card group border-border bg-card p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Account Equity</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ${accountData?.current_balance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-primary drop-shadow-[0_0_12px_rgba(212,175,55,0.5)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          {equityChange !== "0.00" && (
            <div className="mt-4 flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-accent" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <p className={`text-sm font-bold ${isPositive ? "text-accent" : "text-destructive"}`}>
                {isPositive ? "+" : ""}{equityChange}%
              </p>
            </div>
          )}
        </Card>

        <Card className="dashboard-card group border-border bg-card p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Latest Signal</p>
            {latestSignal ? (
              <>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-2xl font-bold text-foreground">
                    {latestSignal.symbol}
                  </p>
                  <Badge
                    variant={latestSignal.direction === "buy" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {latestSignal.direction?.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Confidence: {latestSignal.confidence?.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(latestSignal.created_at).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="mt-2 text-muted-foreground">No signals yet</p>
            )}
          </div>
        </Card>

        <Card className="dashboard-card group border-border bg-card p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-gold/10 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">AI Brain</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-gold to-emerald bg-clip-text text-transparent">
                READY
              </p>
            </div>
            <Brain className="h-12 w-12 text-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.5)] transition-all duration-300 group-hover:scale-110" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground font-medium">
            Multi-AI trading system
          </p>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai-brain">AI Brain</TabsTrigger>
          <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Middle Row - Chart + Recent Signals */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="dashboard-card border-border bg-card p-6 backdrop-blur-sm shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-foreground">
                Account Equity
              </h3>
              {accountData && <AccountEquityChart history={[
                accountData.starting_balance * 0.95,
                accountData.starting_balance,
                accountData.current_balance
              ]} />}
            </Card>

            <Card className="dashboard-card border-border bg-card p-6 backdrop-blur-sm shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-foreground">
                Recent Signals
              </h3>
              <div className="space-y-3">
                {recentSignals.length > 0 ? (
                  recentSignals.map((signal) => (
                    <div
                      key={signal.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-all hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {signal.symbol} {signal.timeframe}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(signal.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={signal.direction === "buy" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {signal.direction?.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {signal.confidence?.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent signals</p>
                )}
              </div>
            </Card>
          </div>

          {/* Bottom Row - Pipeline Visualization */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="dashboard-card border-border bg-card p-6 backdrop-blur-sm shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-foreground">
                Latest Pipeline Run
              </h3>
              {latestRun ? (
                <AgentPipelineGraph latestRun={latestRun} />
              ) : (
                <p className="text-sm text-muted-foreground">No pipeline runs yet</p>
              )}
            </Card>

            <Card className="dashboard-card border-border bg-card p-6 backdrop-blur-sm shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-foreground">
                Agent Results
              </h3>
              {latestRun ? (
                <PipelineRunTable pipelineRun={latestRun} />
              ) : (
                <p className="text-sm text-muted-foreground">No pipeline runs yet</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <ProfessionalPerformance accountId={accountData?.id || process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || "1"} />
        </TabsContent>

        <TabsContent value="ai-brain" className="mt-6">
          <AIBrainControlPanel />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketAnalysis accountId={accountData?.id || process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || "1"} />
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trading Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Win Rate</span>
                    <span className="text-lg font-bold text-emerald">
                      {performanceMetrics?.winRate ? performanceMetrics.winRate.toFixed(1) : "--"}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-emerald h-2 rounded-full transition-all" 
                      style={{ width: `${performanceMetrics?.winRate || 0}%` }} 
                    />
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Avg Profit/Trade</span>
                    <span className="text-lg font-bold text-gold">
                      €{performanceMetrics?.expectancy ? performanceMetrics.expectancy.toFixed(2) : "--"}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profit Factor</span>
                    <span className="text-lg font-bold">
                      {performanceMetrics?.profitFactor ? performanceMetrics.profitFactor.toFixed(2) : "--"}
                    </span>
                  </div>
                </div>
                {performanceMetrics?.winRate >= 60 && performanceMetrics?.profitFactor >= 2.0 ? (
                  <div className="p-4 bg-emerald/10 border border-emerald/20 rounded-lg">
                    <div className="text-sm font-medium text-emerald mb-1">Professional Performance 🎯</div>
                    <div className="text-xs text-muted-foreground">
                      Your AI is performing at professional trader level!
                    </div>
                  </div>
                ) : performanceMetrics?.totalTrades > 0 ? (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-sm font-medium text-yellow-500 mb-1">Building Track Record</div>
                    <div className="text-xs text-muted-foreground">
                      Complete more trades to reach professional performance levels
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Getting Started</div>
                    <div className="text-xs text-muted-foreground">
                      Complete at least 10 trades to see performance metrics
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
