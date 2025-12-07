-- ============================================================================
-- PROFESSIONAL TRADER AI - DATABASE SCHEMA
-- ============================================================================
-- This file contains all database tables needed for the professional trading system
-- Run this in your Supabase SQL editor

-- ============================================================================
-- 1. TRADE HISTORY TABLE
-- ============================================================================
-- Stores completed trades for performance analysis and learning
CREATE TABLE IF NOT EXISTS trade_history (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Trade identification
  account_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  
  -- Trade execution details
  entry_price NUMERIC(15, 2) NOT NULL,
  exit_price NUMERIC(15, 2) NOT NULL,
  stop_loss NUMERIC(15, 2) NOT NULL,
  take_profit NUMERIC(15, 2) NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ NOT NULL,
  
  -- Trade results
  pnl NUMERIC(15, 2) NOT NULL,              -- Profit/Loss in dollars
  pnl_percent NUMERIC(10, 4) NOT NULL,      -- Profit/Loss in percentage
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'breakeven')),
  
  -- Professional setup information
  setup_type TEXT NOT NULL,                  -- 'breakout', 'reversal', 'continuation', etc.
  setup_quality INTEGER NOT NULL CHECK (setup_quality >= 0 AND setup_quality <= 100),
  timeframe_alignment INTEGER NOT NULL CHECK (timeframe_alignment >= 0 AND timeframe_alignment <= 100),
  risk_reward_ratio NUMERIC(10, 2) NOT NULL,
  
  -- Market conditions at trade time (JSON)
  market_conditions JSONB,
  -- Example structure:
  -- {
  --   "trend": "bullish",
  --   "volatility": "medium",
  --   "volume": 1500000,
  --   "fearGreed": 55,
  --   "marketRegime": "markup"
  -- }
  
  -- Exit information
  exit_reason TEXT NOT NULL CHECK (
    exit_reason IN ('take-profit', 'stop-loss', 'trailing-stop', 'manual', 'timeout')
  ),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_history_account 
  ON trade_history(account_id);

CREATE INDEX IF NOT EXISTS idx_trade_history_exit_time 
  ON trade_history(exit_time DESC);

CREATE INDEX IF NOT EXISTS idx_trade_history_result 
  ON trade_history(result);

CREATE INDEX IF NOT EXISTS idx_trade_history_setup_type 
  ON trade_history(setup_type);

CREATE INDEX IF NOT EXISTS idx_trade_history_account_exit 
  ON trade_history(account_id, exit_time DESC);

-- Comment on table
COMMENT ON TABLE trade_history IS 
  'Stores completed trades for performance tracking and learning. Used by TradingPerformanceTracker.';

-- ============================================================================
-- 2. BRAIN DECISIONS TABLE (Enhanced)
-- ============================================================================
-- Stores AI brain decisions and reasoning
CREATE TABLE IF NOT EXISTS brain_decisions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Decision identification
  account_id UUID NOT NULL,
  symbol TEXT,
  
  -- Decision details
  action TEXT NOT NULL,                      -- 'TRADE_BUY', 'TRADE_SELL', 'WAIT', 'HALT'
  reasoning TEXT NOT NULL,                   -- Human-readable reasoning
  
  -- Professional reasoning data (JSON)
  professional_reasoning JSONB,
  -- Example structure:
  -- {
  --   "setupType": "breakout",
  --   "setupQuality": 85,
  --   "riskRewardRatio": 3.0,
  --   "winProbability": 65,
  --   "timeframeAlignment": 90,
  --   "marketPsychology": "neutral",
  --   "checklist": [...]
  -- }
  
  -- AI validation data (JSON)
  ai_validation JSONB,
  -- Example structure:
  -- {
  --   "agreement": 85,
  --   "gemini": {...},
  --   "openai": {...},
  --   "deepseek": {...}
  -- }
  
  -- Metadata
  metadata JSONB,                            -- Additional context
  daily_pnl NUMERIC(15, 2),                 -- Daily P&L at decision time
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brain_decisions_account 
  ON brain_decisions(account_id);

CREATE INDEX IF NOT EXISTS idx_brain_decisions_created 
  ON brain_decisions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brain_decisions_action 
  ON brain_decisions(action);

-- Comment on table
COMMENT ON TABLE brain_decisions IS 
  'Stores AI brain decisions with professional reasoning and AI validation for transparency.';

-- ============================================================================
-- 3. PERFORMANCE INSIGHTS TABLE (New)
-- ============================================================================
-- Stores generated insights for continuous improvement
CREATE TABLE IF NOT EXISTS performance_insights (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Insight identification
  account_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'weakness', 'opportunity', 'recommendation')),
  
  -- Insight details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  actionable BOOLEAN DEFAULT false,
  suggested_action TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'implemented', 'dismissed')),
  
  -- Metrics at insight generation
  metrics JSONB,
  -- Example structure:
  -- {
  --   "winRate": 65.5,
  --   "profitFactor": 2.8,
  --   "expectancy": 83.33,
  --   "totalTrades": 15
  -- }
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  implemented_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_insights_account 
  ON performance_insights(account_id);

CREATE INDEX IF NOT EXISTS idx_performance_insights_status 
  ON performance_insights(status);

CREATE INDEX IF NOT EXISTS idx_performance_insights_impact 
  ON performance_insights(impact);

-- Comment on table
COMMENT ON TABLE performance_insights IS 
  'Stores performance insights generated by the learning system for continuous improvement.';

-- ============================================================================
-- 4. UPDATE EXISTING TRADE_SIGNALS TABLE
-- ============================================================================
-- Add professional reasoning columns to existing trade_signals table
ALTER TABLE trade_signals 
  ADD COLUMN IF NOT EXISTS ai_reasoning JSONB;

COMMENT ON COLUMN trade_signals.ai_reasoning IS 
  'Stores professional reasoning, AI validation, and trade plan in JSON format.';

-- ============================================================================
-- 5. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trade_history
DROP TRIGGER IF EXISTS update_trade_history_updated_at ON trade_history;
CREATE TRIGGER update_trade_history_updated_at
  BEFORE UPDATE ON trade_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for performance_insights
DROP TRIGGER IF EXISTS update_performance_insights_updated_at ON performance_insights;
CREATE TRIGGER update_performance_insights_updated_at
  BEFORE UPDATE ON performance_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables

-- Trade history
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trade history" ON trade_history;
CREATE POLICY "Users can view own trade history" 
  ON trade_history FOR SELECT 
  USING (account_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own trade history" ON trade_history;
CREATE POLICY "Users can insert own trade history" 
  ON trade_history FOR INSERT 
  WITH CHECK (account_id = auth.uid());

-- Brain decisions
ALTER TABLE brain_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own brain decisions" ON brain_decisions;
CREATE POLICY "Users can view own brain decisions" 
  ON brain_decisions FOR SELECT 
  USING (account_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own brain decisions" ON brain_decisions;
CREATE POLICY "Users can insert own brain decisions" 
  ON brain_decisions FOR INSERT 
  WITH CHECK (account_id = auth.uid());

-- Performance insights
ALTER TABLE performance_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON performance_insights;
CREATE POLICY "Users can view own insights" 
  ON performance_insights FOR SELECT 
  USING (account_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own insights" ON performance_insights;
CREATE POLICY "Users can manage own insights" 
  ON performance_insights FOR ALL 
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- ============================================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Example: Insert sample trade history
/*
INSERT INTO trade_history (
  account_id,
  symbol,
  direction,
  entry_price,
  exit_price,
  stop_loss,
  take_profit,
  entry_time,
  exit_time,
  pnl,
  pnl_percent,
  result,
  setup_type,
  setup_quality,
  timeframe_alignment,
  risk_reward_ratio,
  market_conditions,
  exit_reason
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with your account_id
  'BTCUSDT',
  'buy',
  50000.00,
  51500.00,
  49000.00,
  52000.00,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '30 minutes',
  150.00,
  3.00,
  'win',
  'breakout',
  85,
  90,
  3.0,
  '{"trend": "bullish", "volatility": "medium", "volume": 1500000, "fearGreed": 55, "marketRegime": "markup"}'::jsonb,
  'take-profit'
);
*/

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Tables created:
--   1. trade_history - Performance tracking
--   2. brain_decisions - Enhanced AI reasoning logs
--   3. performance_insights - Learning system insights
--   4. trade_signals - Updated with ai_reasoning column
--
-- Your professional trading AI is ready to learn and improve! 🚀
-- ============================================================================

-- Verify tables
SELECT 
  'trade_history' as table_name, 
  COUNT(*) as row_count 
FROM trade_history
UNION ALL
SELECT 
  'brain_decisions', 
  COUNT(*) 
FROM brain_decisions
UNION ALL
SELECT 
  'performance_insights', 
  COUNT(*) 
FROM performance_insights;
