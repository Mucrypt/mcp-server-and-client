"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import {
  Settings,
  Database,
  Zap,
  Shield,
  DollarSign,
  TrendingUp,
  Brain,
  Key,
  Server,
  Activity
} from "lucide-react";

export default function SettingsPage() {
  const [brainStatus, setBrainStatus] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, agentsRes, accountsRes] = await Promise.all([
        api.getBrainStatus(),
        api.agentsStatus(),
        api.getAccounts()
      ]);
      setBrainStatus(statusRes);
      setAgents(agentsRes);
      setAccounts(accountsRes);
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-gold/20 to-emerald/20 rounded-lg">
          <Settings className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Manage your AI trading system configuration</p>
        </div>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* API Keys Management */}
        <TabsContent value="api" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold">AI Provider API Keys</h2>
            </div>

            <div className="space-y-6">
              <APIKeySection
                name="Google Gemini"
                envVar="GEMINI_API_KEY"
                connected={brainStatus?.aiProviders?.gemini}
                link="https://aistudio.google.com/app/apikey"
                cost="FREE"
                description="Fast analysis, best for quick decisions"
              />

              <APIKeySection
                name="OpenAI GPT-4"
                envVar="OPENAI_API_KEY"
                connected={brainStatus?.aiProviders?.openai}
                link="https://platform.openai.com/api-keys"
                cost="$5-10/month"
                description="Deep reasoning, best for complex analysis"
              />

              <APIKeySection
                name="DeepSeek"
                envVar="DEEPSEEK_API_KEY"
                connected={brainStatus?.aiProviders?.deepseek}
                link="https://platform.deepseek.com/api_keys"
                cost="Very cheap"
                description="Pattern recognition, cost-effective"
              />
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Active AI Providers</div>
                  <div className="text-sm text-muted-foreground">
                    {brainStatus?.aiProviders?.activeCount || 0}/3 configured
                  </div>
                </div>
                <Badge className={brainStatus?.aiProviders?.activeCount > 0 ? "bg-emerald" : "bg-gray-500"}>
                  {brainStatus?.aiProviders?.activeCount > 0 ? "READY" : "NOT CONFIGURED"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold">Database Configuration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Supabase URL</Label>
                <Input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  disabled
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-emerald">CONNECTED</Badge>
                  <span className="text-sm text-muted-foreground">Database operational</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Agents Configuration */}
        <TabsContent value="agents" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold">Trading Agents</h2>
            </div>

            <div className="space-y-3">
              {agents.map((agent, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Switch checked={agent.enabled} />
                    <div className="flex-1">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">{agent.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{agent.group}</Badge>
                    <span className="text-sm text-muted-foreground">Priority: {agent.priority}</span>
                    {agent.last_signal && (
                      <Badge className="bg-emerald">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Risk Management */}
        <TabsContent value="risk" className="space-y-6">
          <RiskManagementSettings />
        </TabsContent>

        {/* Accounts */}
        <TabsContent value="accounts" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-semibold">Trading Accounts</h2>
              </div>
              <Button className="bg-gold hover:bg-gold/90">
                Add Account
              </Button>
            </div>

            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Balance: ${Number(account.current_balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Max Risk</div>
                      <div className="font-medium">{account.max_risk_per_trade}%</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* System Info */}
        <TabsContent value="system" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Server className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold">System Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Version</div>
                <div className="font-semibold">v1.0.0</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">API Server</div>
                <div className="font-semibold">http://localhost:4000</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Active Agents</div>
                <div className="font-semibold">{agents.filter(a => a.enabled).length}/{agents.length}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">AI Providers</div>
                <div className="font-semibold">{brainStatus?.aiProviders?.activeCount || 0}/3</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold">Performance Targets</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald/10 border border-emerald/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-emerald">Daily Profit Target</div>
                    <div className="text-sm text-muted-foreground">€100 per day</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald" />
                </div>
              </div>

              <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gold">Risk-Reward Ratio</div>
                    <div className="text-sm text-muted-foreground">Minimum 2:1</div>
                  </div>
                  <Shield className="h-8 w-8 text-gold" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function APIKeySection({
  name,
  envVar,
  connected,
  link,
  cost,
  description
}: {
  name: string;
  envVar: string;
  connected: boolean;
  link: string;
  cost: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <Badge className={connected ? "bg-emerald" : "bg-gray-500"}>
          {connected ? "CONNECTED" : "NOT SET"}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Environment Variable:</span>
          <code className="px-2 py-1 bg-muted rounded text-xs">{envVar}</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Cost:</span>
          <span className="font-medium">{cost}</span>
        </div>
        <div className="mt-2">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline text-sm"
          >
            Get API Key →
          </a>
        </div>
      </div>
    </div>
  );
}

function RiskManagementSettings() {
  const [maxDailyLoss, setMaxDailyLoss] = useState(50);
  const [maxPositionSize, setMaxPositionSize] = useState(5);
  const [minConfidence, setMinConfidence] = useState(70);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-semibold">Risk Management Rules</h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Max Daily Loss</Label>
            <span className="text-sm font-medium">€{maxDailyLoss}</span>
          </div>
          <Slider
            value={[maxDailyLoss]}
            onValueChange={([value]) => setMaxDailyLoss(value)}
            min={10}
            max={200}
            step={10}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Trading stops automatically if daily loss exceeds this amount
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Max Position Size</Label>
            <span className="text-sm font-medium">{maxPositionSize}%</span>
          </div>
          <Slider
            value={[maxPositionSize]}
            onValueChange={([value]) => setMaxPositionSize(value)}
            min={1}
            max={10}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Maximum percentage of account to risk per trade
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Min AI Confidence</Label>
            <span className="text-sm font-medium">{minConfidence}%</span>
          </div>
          <Slider
            value={[minConfidence]}
            onValueChange={([value]) => setMinConfidence(value)}
            min={50}
            max={95}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Minimum AI confidence required to execute trades
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Stop Loss</Label>
            <span className="text-sm font-medium">{stopLossPercent}%</span>
          </div>
          <Slider
            value={[stopLossPercent]}
            onValueChange={([value]) => setStopLossPercent(value)}
            min={1}
            max={5}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Automatic stop loss percentage from entry price
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Take Profit</Label>
            <span className="text-sm font-medium">{takeProfitPercent}%</span>
          </div>
          <Slider
            value={[takeProfitPercent]}
            onValueChange={([value]) => setTakeProfitPercent(value)}
            min={2}
            max={10}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Automatic take profit percentage from entry price
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium">Risk-Reward Ratio</div>
              <div className="text-sm text-muted-foreground">
                Based on current settings
              </div>
            </div>
            <div className="text-2xl font-bold text-gold">
              {(takeProfitPercent / stopLossPercent).toFixed(1)}:1
            </div>
          </div>
        </div>

        <Button className="w-full bg-gold hover:bg-gold/90">
          Save Risk Settings
        </Button>
      </div>
    </Card>
  );
}
