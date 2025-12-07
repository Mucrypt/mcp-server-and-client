"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from "lucide-react";

export default function TradesPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgConfidence: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getTradeSignals();
        setSignals(data);

        // Calculate stats
        const totalTrades = data.length;
        const avgConfidence = totalTrades > 0
          ? data.reduce((sum: number, s: any) => sum + (s.confidence || 0), 0) / totalTrades
          : 0;

        setStats({
          totalPnL: 0, // TODO: Calculate from actual trades
          winRate: 0, // TODO: Calculate from executed trades
          totalTrades,
          avgConfidence,
        });
      } catch (error) {
        console.error("Failed to fetch trade signals:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trade Signals</h1>
        <p className="mt-2 text-muted-foreground">
          Track all trading signals and performance metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-border bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Signals</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {stats.totalTrades}
              </p>
            </div>
            <BarChart3 className="h-10 w-10 text-sky-400" />
          </div>
        </Card>

        <Card className="border-border bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total PnL</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                ${stats.totalPnL.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-emerald-400" />
          </div>
        </Card>

        <Card className="border-border bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {stats.winRate.toFixed(0)}%
              </p>
            </div>
            <Target className="h-10 w-10 text-sky-400" />
          </div>
        </Card>

        <Card className="border-border bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-emerald-400" />
          </div>
        </Card>
      </div>

      {/* Signals Table */}
      <Card className="border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          All Trade Signals
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Timeframe</th>
                <th className="pb-3 font-medium">Direction</th>
                <th className="pb-3 font-medium">Confidence</th>
                <th className="pb-3 font-medium">Leverage</th>
                <th className="pb-3 font-medium">Agent</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr
                  key={signal.id}
                  className="border-b border-border/50 text-sm transition-colors hover:bg-muted/30"
                >
                  <td className="py-3 font-mono font-medium text-foreground">
                    {signal.symbol}
                  </td>
                  <td className="py-3 text-muted-foreground">{signal.timeframe}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {signal.direction === "buy" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <Badge
                        variant={signal.direction === "buy" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {signal.direction?.toUpperCase()}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 text-foreground">
                    {(signal.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 text-foreground">
                    {signal.leverage ? `${signal.leverage}x` : "-"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {signal.created_by_agent || "-"}
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-xs">
                      {signal.status || "pending"}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(signal.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {signals.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No trade signals yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
