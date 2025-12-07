"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Play, 
  Pause, 
  CheckCircle2,
  XCircle,
  Activity,
  DollarSign
} from "lucide-react";

interface BrainConfig {
  maxDailyLoss: number;
  maxPositionSize: number;
  minConfidence: number;
  enableAutoTrading: boolean;
}

export function AIBrainControlPanel() {
  const [brainStatus, setBrainStatus] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<BrainConfig>({
    maxDailyLoss: 50,
    maxPositionSize: 5,
    minConfidence: 70,
    enableAutoTrading: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBrainStatus();
    const interval = setInterval(fetchBrainStatus, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchBrainStatus = async () => {
    try {
      const status = await api.getBrainStatus();
      setBrainStatus(status);
      setIsRunning(status.isRunning || false);
    } catch (error) {
      console.error("Failed to fetch brain status:", error);
    }
  };

  const handleStartStop = async () => {
    setLoading(true);
    try {
      const action = isRunning ? "stop" : "start";
      await api.controlBrain(action, config);
      setIsRunning(!isRunning);
      await fetchBrainStatus();
    } catch (error) {
      console.error("Failed to control brain:", error);
    } finally {
      setLoading(false);
    }
  };

  const aiProviders = brainStatus?.aiProviders || {};
  const dailyPnL = brainStatus?.dailyPnL || 0;
  const activeAIs = aiProviders.activeCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-gold/20 to-emerald/20 rounded-lg">
            <Brain className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Multi-AI Trading Brain</h2>
            <p className="text-sm text-muted-foreground">
              Autonomous trading with {activeAIs}/3 AI models
            </p>
          </div>
        </div>
        <Button
          onClick={handleStartStop}
          disabled={loading || activeAIs === 0}
          size="lg"
          className={isRunning ? "bg-red-500 hover:bg-red-600" : "bg-emerald hover:bg-emerald/90"}
        >
          {isRunning ? (
            <>
              <Pause className="mr-2 h-5 w-5" />
              Stop Brain
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start Brain
            </>
          )}
        </Button>
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Status</span>
            {isRunning ? (
              <Activity className="h-4 w-4 text-emerald animate-pulse" />
            ) : (
              <Pause className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={isRunning ? "bg-emerald text-white" : "bg-gray-500 text-white"}>
              {isRunning ? "RUNNING" : "STOPPED"}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active AIs</span>
            <Zap className="h-4 w-4 text-gold" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{activeAIs}</span>
            <span className="text-sm text-muted-foreground">/ 3</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily P&L</span>
            <DollarSign className="h-4 w-4 text-emerald" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${dailyPnL >= 0 ? 'text-emerald' : 'text-red-500'}`}>
              €{dailyPnL.toFixed(2)}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Target</span>
            <TrendingUp className="h-4 w-4 text-gold" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">€100</span>
            <span className="text-sm text-muted-foreground">/ day</span>
          </div>
        </Card>
      </div>

      {/* AI Providers Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            {aiProviders.gemini ? (
              <CheckCircle2 className="h-5 w-5 text-emerald" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">Google Gemini</div>
              <div className="text-xs text-muted-foreground">
                {aiProviders.gemini ? "Connected" : "Not configured"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            {aiProviders.openai ? (
              <CheckCircle2 className="h-5 w-5 text-emerald" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">OpenAI GPT-4</div>
              <div className="text-xs text-muted-foreground">
                {aiProviders.openai ? "Connected" : "Not configured"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            {aiProviders.deepseek ? (
              <CheckCircle2 className="h-5 w-5 text-emerald" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">DeepSeek</div>
              <div className="text-xs text-muted-foreground">
                {aiProviders.deepseek ? "Connected" : "Not configured"}
              </div>
            </div>
          </div>
        </div>

        {activeAIs === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-yellow-500">No AI Providers Configured</div>
              <div className="text-sm text-muted-foreground mt-1">
                Add at least one API key in your .env file to enable autonomous trading.
                <br />
                Minimum: GEMINI_API_KEY (free at aistudio.google.com)
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Trading Configuration</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Max Daily Loss</label>
              <span className="text-sm text-muted-foreground">€{config.maxDailyLoss}</span>
            </div>
            <Slider
              value={[config.maxDailyLoss]}
              onValueChange={([value]) => setConfig({ ...config, maxDailyLoss: value })}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Brain stops trading if daily loss exceeds this amount
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Max Position Size</label>
              <span className="text-sm text-muted-foreground">{config.maxPositionSize}%</span>
            </div>
            <Slider
              value={[config.maxPositionSize]}
              onValueChange={([value]) => setConfig({ ...config, maxPositionSize: value })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum % of account to risk per trade
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Min AI Confidence</label>
              <span className="text-sm text-muted-foreground">{config.minConfidence}%</span>
            </div>
            <Slider
              value={[config.minConfidence]}
              onValueChange={([value]) => setConfig({ ...config, minConfidence: value })}
              min={50}
              max={90}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum AI confidence required to execute trades
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium">Auto Trading</div>
              <div className="text-xs text-muted-foreground">
                {config.enableAutoTrading ? "Real trades will be executed" : "Paper trading mode"}
              </div>
            </div>
            <Button
              variant={config.enableAutoTrading ? "destructive" : "default"}
              onClick={() => setConfig({ ...config, enableAutoTrading: !config.enableAutoTrading })}
            >
              {config.enableAutoTrading ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Decisions */}
      {brainStatus?.recentDecisions && brainStatus.recentDecisions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent AI Decisions</h3>
          <div className="space-y-2">
            {brainStatus.recentDecisions.slice(0, 5).map((decision: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <Badge className={decision.action === 'BUY' ? 'bg-emerald' : decision.action === 'SELL' ? 'bg-red-500' : 'bg-gray-500'}>
                    {decision.action}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(decision.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={decision.daily_pnl >= 0 ? 'text-emerald font-medium' : 'text-red-500 font-medium'}>
                  €{Number(decision.daily_pnl || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
