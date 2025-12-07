export type AgentStatus = {
  name: string;
  role: string;
  group: string;
  priority: number;
  enabled: boolean;
  meta: any;
  last_signal: {
    created_at: string;
    score: number;
    confidence: number;
  } | null;
};

export type TradingAccount = {
  id: string;
  user_id: number;
  name: string;
  starting_balance: number;
  current_balance: number;
  max_leverage: number;
  max_risk_per_trade: number;
  created_at: string;
};

export type TradeSignal = {
  id: string;
  account_id: string;
  symbol: string;
  timeframe: string;
  direction: "buy" | "sell" | "hold";
  leverage: number;
  confidence: number;
  status: "pending" | "executed" | "rejected";
  created_by_agent: string;
  created_at: string;
};

export type AgentSignal = {
  id: string;
  account_id: string;
  symbol: string;
  timeframe: string;
  agent_name: string;
  score: number;
  confidence: number;
  payload: any;
  created_at: string;
};

export type PipelineRun = {
  id: string;
  account_id: string;
  symbol: string;
  timeframe: string;
  status: "running" | "completed" | "failed";
  created_at: string;
  steps: {
    agent_name: string;
    started_at: string;
    finished_at: string;
    score: number;
    confidence: number;
  }[];
};

// Professional Trading Performance Types
export type PerformanceMetrics = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  expectancy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgHoldingTime: number;
  bestSetupType?: string;
  worstSetupType?: string;
  bestTimeOfDay?: string;
  optimalRiskReward?: number;
};

export type TradeHistory = {
  id: string;
  account_id: string;
  symbol: string;
  timeframe: string;
  direction: "long" | "short";
  entry_price: number;
  exit_price: number;
  quantity: number;
  leverage: number;
  entry_time: string;
  exit_time: string;
  profit_loss: number;
  profit_loss_percent: number;
  result: "win" | "loss" | "breakeven";
  setup_type?: string;
  risk_reward_actual?: number;
  holding_time_hours?: number;
  professional_reasoning?: any;
  created_at: string;
};

export type PerformanceInsight = {
  id: string;
  account_id: string;
  insight_type: "strength" | "weakness" | "opportunity" | "recommendation";
  title: string;
  description: string;
  supporting_data: any;
  actionable: boolean;
  priority: "high" | "medium" | "low";
  created_at: string;
};

export type TradingJournalEntry = {
  date: string;
  trades: number;
  wins: number;
  losses: number;
  dailyPnL: number;
  winRate: number;
  notes?: string[];
};
