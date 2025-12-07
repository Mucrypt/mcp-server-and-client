"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Search, Brain, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export function MarketAnalysis({ accountId }: { accountId: string }) {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await api.analyzeMarket(symbol, accountId);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-gold/20 to-emerald/20 rounded-lg">
            <Brain className="h-5 w-5 text-gold" />
          </div>
          <h3 className="text-lg font-semibold">Multi-AI Market Analysis</h3>
        </div>
      </div>

      <div className="space-y-4">
        {/* Symbol Selection */}
        <div className="flex gap-2">
          {symbols.map((s) => (
            <Button
              key={s}
              variant={symbol === s ? "default" : "outline"}
              size="sm"
              onClick={() => setSymbol(s)}
              className={symbol === s ? "bg-gold hover:bg-gold/90" : ""}
            >
              {s.replace("USDT", "")}
            </Button>
          ))}
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-gold to-emerald hover:opacity-90"
        >
          <Search className="mr-2 h-4 w-4" />
          {loading ? "Analyzing with 3 AIs..." : "Analyze Market"}
        </Button>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4 mt-6 animate-in fade-in duration-500">
            {/* Consensus */}
            <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">AI Consensus</span>
                <Badge 
                  className={
                    analysis.direction === "buy" 
                      ? "bg-emerald text-white" 
                      : analysis.direction === "sell"
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                  }
                >
                  {analysis.direction.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confidence</span>
                  <span className="font-semibold">{analysis.confidence}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-gold to-emerald h-2 rounded-full transition-all"
                    style={{ width: `${analysis.confidence}%` }}
                  />
                </div>

                {analysis.aiConsensus && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">Agreement</span>
                    <span className="font-semibold">{analysis.aiConsensus.agreement.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Individual AI Responses */}
            {analysis.aiConsensus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis.aiConsensus.gemini && (
                  <AIResponseCard 
                    name="Gemini" 
                    response={analysis.aiConsensus.gemini} 
                  />
                )}
                {analysis.aiConsensus.openai && (
                  <AIResponseCard 
                    name="OpenAI" 
                    response={analysis.aiConsensus.openai} 
                  />
                )}
                {analysis.aiConsensus.deepseek && (
                  <AIResponseCard 
                    name="DeepSeek" 
                    response={analysis.aiConsensus.deepseek} 
                  />
                )}
              </div>
            )}

            {/* Risk Assessment */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-gold" />
                <span className="font-medium">Risk Level</span>
              </div>
              <Badge className={
                analysis.riskLevel === "low" 
                  ? "bg-emerald" 
                  : analysis.riskLevel === "medium"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }>
                {analysis.riskLevel.toUpperCase()}
              </Badge>
            </div>

            {/* AI Reasoning */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-gold" />
                <span className="font-medium">AI Reasoning</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.reasoning}
              </p>
            </div>

            {/* Suggested Actions */}
            {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-emerald" />
                  <span className="font-medium">Suggested Actions</span>
                </div>
                <ul className="space-y-2">
                  {analysis.suggestedActions.map((action: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-gold mt-1">•</span>
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function AIResponseCard({ name, response }: { name: string; response: any }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">{name}</span>
        <Badge 
          variant="outline" 
          className={
            response.direction === "buy" 
              ? "border-emerald text-emerald" 
              : response.direction === "sell"
              ? "border-red-500 text-red-500"
              : "border-gray-500 text-gray-500"
          }
        >
          {response.direction}
        </Badge>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{response.confidence}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Risk</span>
          <span className="font-medium">{response.riskLevel}</span>
        </div>
      </div>
    </div>
  );
}
