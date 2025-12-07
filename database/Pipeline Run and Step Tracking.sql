-- === PIPELINE EXECUTION TRACKING ===

-- Tracks each full pipeline execution (all agents running for a specific symbol/timeframe)
create table if not exists pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references trading_accounts(id) on delete cascade,
  symbol text not null,
  timeframe text not null,
  status text not null default 'running', -- running/completed/failed
  started_at timestamptz default now(),
  completed_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  
  -- Add indexes for common queries
  constraint pipeline_runs_status_check check (status in ('running', 'completed', 'failed'))
);

create index if not exists idx_pipeline_runs_account_status 
  on pipeline_runs(account_id, status);
create index if not exists idx_pipeline_runs_created_at 
  on pipeline_runs(created_at desc);

-- Tracks individual agent execution within a pipeline run
create table if not exists pipeline_steps (
  id bigserial primary key,
  run_id uuid references pipeline_runs(id) on delete cascade,
  agent_name text references agents(name) on delete restrict,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_ms int generated always as (
    extract(epoch from (finished_at - started_at)) * 1000
  ) stored,
  score numeric(6,3),
  confidence numeric(5,2),
  payload jsonb,
  error_message text,
  created_at timestamptz default now(),
  
  -- Add constraints
  constraint pipeline_steps_score_check check (score >= -1 and score <= 1),
  constraint pipeline_steps_confidence_check check (confidence >= 0 and confidence <= 100)
);

create index if not exists idx_pipeline_steps_run_id 
  on pipeline_steps(run_id);
create index if not exists idx_pipeline_steps_agent_name 
  on pipeline_steps(agent_name);
create index if not exists idx_pipeline_steps_started_at 
  on pipeline_steps(started_at desc);

-- View to get pipeline run summaries with agent counts
create or replace view pipeline_run_summaries as
select 
  pr.id,
  pr.account_id,
  pr.symbol,
  pr.timeframe,
  pr.status,
  pr.started_at,
  pr.completed_at,
  extract(epoch from (coalesce(pr.completed_at, now()) - pr.started_at)) * 1000 as duration_ms,
  count(ps.id) as total_steps,
  count(ps.finished_at) as completed_steps,
  avg(ps.confidence) as avg_confidence,
  avg(ps.score) as avg_score
from pipeline_runs pr
left join pipeline_steps ps on ps.run_id = pr.id
group by pr.id;

