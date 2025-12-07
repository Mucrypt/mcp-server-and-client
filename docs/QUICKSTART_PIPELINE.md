# Quick Start: Pipeline Mode

## 1. Setup Database

Run this SQL in Supabase SQL Editor:

```sql
-- Create test trading account
INSERT INTO trading_accounts (id, name, starting_balance, current_balance, max_leverage, max_risk_per_trade)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Account', 10000, 10000, 10, 2);
```

## 2. Configure Environment

Edit `.env`:

```env
AGENT_MODE=pipeline
TEST_ACCOUNT_ID=00000000-0000-0000-0000-000000000001
```

## 3. Start Services

### Terminal 1: Main Server (API + ExecutionAgent)

```bash
npm run server:dev
```

Expected output:
```
🔄 Running in PIPELINE mode
   Use POST /pipeline/run to trigger runs
🌐 HTTP API listening on http://localhost:4000
🔵 Agent execution-agent started.
```

### Terminal 2 (Optional): Scheduler

To run pipeline automatically every hour:

```bash
npm run pipeline:scheduler
```

## 4. Test the Pipeline

### Option A: Test Script

```bash
npm run pipeline:test
```

### Option B: Manual HTTP Trigger

```bash
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "00000000-0000-0000-0000-000000000001",
    "symbol": "BTCUSDT",
    "timeframe": "1h"
  }'
```

Response:
```json
{
  "runId": "uuid-here",
  "status": "running"
}
```

## 5. View Results

### API Endpoints

```bash
# Pipeline runs
curl http://localhost:4000/pipeline/runs

# Trade signals
curl http://localhost:4000/accounts/00000000-0000-0000-0000-000000000001/trade-signals

# Agent status
curl http://localhost:4000/agents/status
```

### Admin Dashboard

Open browser: http://localhost:3001/dashboard

## 6. Check Database

```sql
-- Latest pipeline run
SELECT * FROM pipeline_runs 
ORDER BY created_at DESC 
LIMIT 1;

-- Steps in that run
SELECT agent_name, score, confidence, duration_ms 
FROM pipeline_steps 
WHERE run_id = 'run-id-here'
ORDER BY created_at;

-- Trade signals
SELECT * FROM trade_signals 
ORDER BY created_at DESC 
LIMIT 5;
```

## Troubleshooting

### Pipeline doesn't start
- Check `TEST_ACCOUNT_ID` exists: `SELECT * FROM trading_accounts WHERE id = '...'`
- Check logs for errors
- Verify `AGENT_MODE=pipeline` in .env

### All agent scores are 0
- This is normal if market data is unavailable
- Check Binance API access: `curl https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1`
- Review `pipeline_steps.payload` for error messages

### Trade signal not created
- If finalScore is between -0.25 and 0.25, decision is HOLD (expected)
- Check `pipeline_runs.status = 'completed'`
- Review pipeline_steps to see individual agent outputs

### ExecutionAgent not executing
- Check Redis: `redis-cli LLEN execution:queue`
- Verify ExecutionAgent is running (should see "🔵 Agent execution-agent started")
- Check trade_signals status field

## Next Steps

1. **Monitor Performance**: Use `pipeline_run_summaries` view
2. **Adjust Weights**: Edit `fuseDecision()` in `pipeline_orchestrator.ts`
3. **Add Agents**: Follow guide in PIPELINE_README.md
4. **Production Deploy**: Use Docker Compose with `docker-compose up`

## Switch Back to Interval Mode

If you prefer the old continuous agents:

```env
AGENT_MODE=interval
```

Restart server:
```bash
npm run server:dev
```

Now agents run every N seconds independently (legacy behavior).
