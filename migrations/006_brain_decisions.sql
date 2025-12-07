-- Create brain_decisions table to log all autonomous trading decisions
CREATE TABLE IF NOT EXISTS brain_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id),
  action TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  daily_pnl NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_brain_decisions_account ON brain_decisions(account_id);
CREATE INDEX idx_brain_decisions_created_at ON brain_decisions(created_at DESC);
CREATE INDEX idx_brain_decisions_action ON brain_decisions(action);

-- Add RLS policies
ALTER TABLE brain_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on brain_decisions"
  ON brain_decisions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add ai_reasoning column to trade_signals if not exists
ALTER TABLE trade_signals 
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
ADD COLUMN IF NOT EXISTS position_size_usd NUMERIC(12,2);

-- Add comment
COMMENT ON TABLE brain_decisions IS 'Logs all decisions made by the autonomous trading brain';
