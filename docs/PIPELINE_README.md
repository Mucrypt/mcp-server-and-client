# Mukulah AI Trading Pipeline

## Overview

This is a **sequential, microservices-ready trading pipeline** that executes AI agents in a fixed order to make trading decisions with strong observability and risk control.

## Architecture

### Pipeline Flow

```
[MarketStructure] → [OrderFlow] → [Momentum] → [VolatilityRegime]
    → [NewsSentiment] → [MultiTimeframe] → [PatternRecognition]
    → [StatisticalEdge] → [RiskManager] → [Decision Fusion]
    → [Trade Signal Creation] → [Execution Queue]
```

### Key Components

1. **Pipeline Orchestrator** (`src/pipeline/pipeline_orchestrator.ts`)
   - Manages the sequential execution of all agents
   - Builds shared context with market data and account info
   - Fuses agent results into final trade decisions
   - Creates trade signals and enqueues them for execution

2. **Agents** (`src/agents/`)
   - Each agent analyzes one aspect of the market
   - Receives `PipelineContext` with previous agent results
   - Returns `AgentResult` (score, confidence, payload)
   - Results are stored in `pipeline_steps` table

3. **Decision Fusion** (`fuseDecision()`)
   - Weighted aggregation of all agent scores
   - Risk-adjusted leverage calculation
   - Final direction: buy/sell/hold
   - Confidence scoring

4. **Execution Agent** (`src/execution/executionAgent.ts`)
   - Runs independently, dequeues trade signals
   - Performs final risk checks
   - Places orders on exchanges (Bybit/Binance)
   - Updates signal status (executed/rejected)

5. **HTTP API** (`src/api/httpServer.ts`)
   - `POST /pipeline/run` - Trigger manual pipeline run
   - `GET /pipeline/runs` - View pipeline execution history
   - `GET /agents/status` - Agent health monitoring
   - `GET /accounts/:id/trade-signals` - View trading decisions

6. **Scheduler** (`src/pipeline/scheduler.ts`)
   - Optional cron-like service
   - Triggers pipeline runs at intervals (e.g., every 1 hour)

## Database Schema

### `pipeline_runs`
Tracks each full pipeline execution:
- `id` - unique run identifier
- `account_id` - trading account
- `symbol` - e.g., BTCUSDT
- `timeframe` - e.g., 1h
- `status` - running/completed/failed
- `created_at`, `finished_at`

### `pipeline_steps`
Tracks each agent's execution within a run:
- `run_id` - links to pipeline_runs
- `agent_name` - e.g., market-structure
- `score`, `confidence` - agent output
- `payload` - additional data (JSON)
- `started_at`, `finished_at`
- `duration_ms` - calculated column

### `trade_signals`
Final trading decisions:
- `account_id`, `symbol`, `timeframe`
- `direction` - buy/sell/hold
- `leverage`, `confidence`
- `status` - pending/executed/rejected
- `created_by_agent` - "decision-agent"

## Running the System

### Mode 1: Interval-Based (Legacy)

Agents run continuously on timers:

```bash
npm run server:dev
```

### Mode 2: Pipeline-Based (Recommended)

Agents run sequentially only when triggered:

```bash
# Set mode in .env
AGENT_MODE=pipeline

# Start API server + ExecutionAgent
npm run server:dev

# In another terminal, start scheduler
npm run pipeline:scheduler
```

### Mode 3: Manual Triggers

Start server in pipeline mode, then trigger via HTTP:

```bash
# Trigger a pipeline run
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "00000000-0000-0000-0000-000000000001",
    "symbol": "BTCUSDT",
    "timeframe": "1h"
  }'

# Check results
curl http://localhost:4000/pipeline/runs
```

## Configuration

### Environment Variables

```env
# Trading Account
TEST_ACCOUNT_ID=00000000-0000-0000-0000-000000000001

# Agent Mode
AGENT_MODE=pipeline  # or "interval"

# Pipeline Scheduler
PIPELINE_SYMBOL=BTCUSDT
PIPELINE_TIMEFRAME=1h
PIPELINE_INTERVAL_MS=3600000  # 1 hour

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Exchange
EXEC_VENUE=bybit  # or "binance-futures"

# AI Model
GEMINI_API_KEY=your_key_here
```

## Decision Fusion Algorithm

The `fuseDecision()` function combines all agent results:

1. **Weighted Score Calculation**
   - Each agent has a weight (e.g., risk-manager: 2.0, market-structure: 1.5)
   - Effective weight = base_weight × (confidence / 100)
   - Final score = Σ(score × effective_weight) / Σ(effective_weight)

2. **Direction Logic**
   - finalScore > 0.25 → BUY
   - finalScore < -0.25 → SELL
   - Otherwise → HOLD

3. **Leverage Adjustment**
   - Based on volatility regime:
     - Calm (regime=1) → leverage 3
     - Normal (regime=2) → leverage 2
     - High (regime=3) → leverage 1
   - Risk manager can veto or reduce leverage

4. **Safety Overrides**
   - If risk-manager score < -0.5 → HOLD (deep drawdown)
   - If risk-manager score < 0 → reduce leverage

## Agent Weights

```typescript
{
  "market-structure": 1.5,   // Trend identification
  "order-flow": 1.2,         // Supply/demand
  "momentum": 1.2,           // Price velocity
  "volatility-regime": 0.8,  // Market conditions
  "news-sentiment": 1.5,     // External events
  "multi-timeframe": 1.3,    // Cross-timeframe confirmation
  "pattern-recognition": 1.0, // Chart patterns
  "statistical-edge": 1.3,   // Mean reversion
  "risk-manager": 2.0        // Account safety (highest weight)
}
```

## Microservices Roadmap

Current: **Monolithic** (all agents in one process)

Future: **True Microservices**

### Phase 1: Split Execution
- Move ExecutionAgent to separate container
- Communicates via Redis queue

### Phase 2: HTTP Agent Services
- Each agent becomes a service with:
  - `POST /agent/:name/run` endpoint
  - Receives PipelineContext subset
  - Returns AgentResult
- Orchestrator calls HTTP instead of local methods

### Phase 3: Event-Driven
- Replace orchestrator polling with event bus
- Agents subscribe to candle close events
- Parallel execution where dependencies allow

### Phase 4: Kubernetes Deployment
- Helm charts for all services
- Horizontal scaling for agents
- Service mesh (Istio/Linkerd)

## Monitoring & Observability

### Pipeline Run Summaries

Use the `pipeline_run_summaries` view:

```sql
SELECT * FROM pipeline_run_summaries 
WHERE account_id = '...' 
ORDER BY created_at DESC 
LIMIT 10;
```

Shows:
- Total steps executed
- Completed/failed step counts
- Total duration
- Per-step statistics

### Admin Dashboard

Access at `http://localhost:3001/dashboard`

Features:
- Real-time agent status
- Trade signal history
- Pipeline run visualization
- Account metrics

## Testing

### Create Test Account

```sql
INSERT INTO trading_accounts (id, name, starting_balance, current_balance, max_leverage, max_risk_per_trade)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Account', 10000, 10000, 10, 2);
```

### Trigger Test Run

```bash
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"accountId": "00000000-0000-0000-0000-000000000001"}'
```

### View Results

```bash
# Pipeline runs
curl http://localhost:4000/pipeline/runs

# Trade signals
curl http://localhost:4000/accounts/00000000-0000-0000-0000-000000000001/trade-signals

# Agent signals
curl http://localhost:4000/accounts/00000000-0000-0000-0000-000000000001/agent-signals
```

## Safety & Risk Management

### No Guarantees
This system does NOT guarantee profit. Trading is risky.

### Built-in Protections
1. **Risk Manager Agent** - Account-level safety checks
2. **Leverage Limits** - Dynamic based on volatility
3. **Drawdown Detection** - Stops trading in deep losses
4. **Confidence Thresholds** - Only trade high-confidence signals
5. **Double Execution Prevention** - Redis locks ensure one-time execution

### Best Practices
- Start with small balance in testnet
- Monitor pipeline_run_summaries regularly
- Adjust agent weights based on performance
- Use paper trading to validate strategies
- Set appropriate max_risk_per_trade (1-2%)

## Extending the System

### Add New Agent

1. Create `src/agents/myNewAgent.ts`:
   ```typescript
   import { TradingAgent, AgentRunResult } from "../core/agentBase";
   
   export class MyNewAgent extends TradingAgent {
     constructor() {
       super("my-new-agent", 300000); // 5 min
     }
     
     async run(): Promise<AgentRunResult> {
       // Your logic
       return {
         agent: this.name,
         symbol: "BTCUSDT",
         timeframe: "1h",
         score: 0.5,  // -1 to 1
         confidence: 75,
         payload: { custom: "data" }
       };
     }
   }
   ```

2. Add to pipeline order in `pipeline_orchestrator.ts`:
   ```typescript
   export const pipelineOrder = [
     "market-structure",
     // ... existing agents
     "my-new-agent",  // Add here
   ] as const;
   ```

3. Instantiate in `runPipelineOnce()`:
   ```typescript
   const agentInstances = {
     // ... existing
     "my-new-agent": new MyNewAgent(),
   };
   ```

4. Update weights in `fuseDecision()`:
   ```typescript
   const weights: Record<string, number> = {
     // ... existing
     "my-new-agent": 1.2,
   };
   ```

### Add Custom Endpoint

Edit `src/api/httpServer.ts`:

```typescript
app.get("/custom/endpoint", async (req, res) => {
  // Your logic
  res.json({ data: "..." });
});
```

## Troubleshooting

### Pipeline runs not starting
- Check `TEST_ACCOUNT_ID` exists in database
- Verify `AGENT_MODE=pipeline` in .env
- Check logs for Supabase connection errors

### Agents returning score=0
- Verify market data is available (check `ohlc_*` in context)
- Check agent-specific API keys (GEMINI_API_KEY, etc.)
- Review pipeline_steps payload for error messages

### Trade signals not executing
- Ensure ExecutionAgent is running
- Check Redis queue: `redis-cli LLEN execution:queue`
- Verify exchange credentials in .env

### Database errors
- Run SQL schema files in order:
  1. `Automated Trading Agents & Signals Schema.sql`
  2. `Pipeline Run and Step Tracking.sql`
- Check foreign key constraints

## Contributing

When submitting changes:
1. Update this README if architecture changes
2. Add tests for new agents
3. Document new environment variables
4. Update SQL schema if needed

## License

ISC
