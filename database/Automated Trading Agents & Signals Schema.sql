-- === TRADING ACCOUNTS ===
-- Note: This assumes a 'users' table already exists with an 'id' column
-- If your users table uses UUID instead of bigint, change the type below
create table if not exists trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,  -- Made nullable to work independently, adjust type to match your users.id
  name text not null,
  starting_balance numeric(18,8) not null,
  current_balance numeric(18,8) not null,
  max_leverage numeric(10,2) not null,
  max_risk_per_trade numeric(5,2) not null,
  created_at timestamptz default now()
);

-- === AGENT REGISTRY ===
create table if not exists agents (
  name text primary key,
  role text not null,
  description text,
  group_name text,
  priority int default 1,
  enabled boolean default true,
  meta jsonb,
  created_at timestamptz default now()
);

-- === RAW AGENT SIGNALS ===
create table if not exists agent_signals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references trading_accounts(id) on delete cascade,
  symbol text not null,
  timeframe text not null,
  agent_name text not null,
  score numeric(6,3),        -- -1 to 1 (bias)
  confidence numeric(5,2),   -- 0-100
  payload jsonb,
  created_at timestamptz default now()
);

-- === FINAL TRADE SIGNALS ===
create table if not exists trade_signals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references trading_accounts(id) on delete cascade,
  symbol text not null,
  timeframe text not null,
  direction text not null,      -- buy/sell/hold
  leverage numeric(10,2) not null,
  entry_price numeric(18,8),
  stop_loss numeric(18,8),
  take_profit numeric(18,8),
  confidence numeric(5,2),
  status text not null default 'pending', -- pending/executed/cancelled
  created_by_agent text,
  created_at timestamptz default now()
);