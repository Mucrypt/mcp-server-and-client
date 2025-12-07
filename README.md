# 🚀 Mukulah AI Trading System

## Architecture Modes

This system supports **three deployment architectures**:

### 1️⃣ **Monolithic** (Default)
All agents run as local instances in a single process.
- ✅ Simple, fast, easy debugging
- ❌ No fault isolation, can't scale individual components

### 2️⃣ **Microservices** (Local)
Each agent runs as a separate HTTP service on localhost.
- ✅ Fault isolation, independent restarts, better monitoring
- ❌ More complex, higher memory usage

### 3️⃣ **Distributed** (Docker/Kubernetes)
Fully containerized microservices across multiple hosts.
- ✅ Production-ready, horizontally scalable, cloud-native
- ❌ Requires orchestration platform, higher operational complexity

---

## Quick Start

### Monolithic Mode

```bash
# Install dependencies
npm install

# Configure .env
cp .env.example .env
# Edit SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.

# Create test account in Supabase
# (See QUICKSTART_PIPELINE.md step 1)

# Start system
npm run server:dev

# Trigger pipeline
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"accountId":"00000000-0000-0000-0000-000000000001"}'
```

### Microservices Mode

```bash
# Terminal 1: Start all agent services
npm run agents:start

# Terminal 2: Start orchestrator
USE_HTTP_AGENTS=true npm run server:dev

# Terminal 3: Trigger pipeline
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"accountId":"...","useHttpAgents":true}'
```

### Docker Mode

```bash
docker-compose -f docker-compose.microservices.yml up --build
```

---

## Project Structure

```
mcp-server-and-client/
├── src/
│   ├── agents/              # Agent implementations (monolithic)
│   │   ├── marketStructureAgent.ts
│   │   ├── orderFlowAgent.ts
│   │   └── ... (9 total)
│   ├── services/            # Agent microservices (HTTP)
│   │   ├── agent-service-base.ts
│   │   ├── market-structure-service.ts
│   │   └── ... (9 services)
│   ├── pipeline/
│   │   ├── pipeline_orchestrator.ts  # Main pipeline logic
│   │   ├── http-agent-client.ts      # HTTP client for services
│   │   ├── scheduler.ts              # Cron-like scheduler
│   │   └── test_pipeline.ts          # Test script
│   ├── core/                # Shared utilities
│   │   ├── agentBase.ts
│   │   ├── dataFeed.ts
│   │   ├── redis.ts
│   │   └── supabase.ts
│   ├── api/
│   │   └── httpServer.ts    # Express REST API
│   ├── execution/
│   │   ├── executionAgent.ts
│   │   └── executionQueue.ts
│   └── server.ts            # Main entry point
├── scripts/
│   ├── start-agents.sh      # Start all agent services
│   ├── stop-agents.sh       # Stop all agent services
│   ├── health-check.sh      # Check service health
│   └── test-microservices.sh
├── mukulah-ai-admin/        # Next.js dashboard
├── data-table/              # SQL schemas
├── docker-compose.microservices.yml
├── PIPELINE_README.md       # Pipeline architecture docs
├── MICROSERVICES_GUIDE.md   # Microservices setup guide
└── QUICKSTART_PIPELINE.md   # Getting started guide
```

---

## Features

### 🤖 **10 Specialized Agents**

| Agent                | Function                          | Port  |
|----------------------|-----------------------------------|-------|
| Market Structure     | Trend identification (MA)         | 5001  |
| Order Flow           | Volume analysis                   | 5002  |
| Momentum             | RSI momentum tracking             | 5003  |
| Volatility Regime    | ATR volatility classification     | 5004  |
| News Sentiment       | Crypto news sentiment             | 5005  |
| Multi-Timeframe      | Cross-timeframe alignment         | 5006  |
| Pattern Recognition  | Chart pattern detection           | 5007  |
| Statistical Edge     | Mean reversion (Z-score)          | 5008  |
| Risk Manager         | Account drawdown protection       | 5009  |
| Decision Agent       | Weighted fusion of all signals    | N/A   |

### 📊 **Sequential Pipeline**

Agents execute in fixed order, not randomly:

```
MarketStructure → OrderFlow → Momentum → Volatility → News 
  → MultiTimeframe → Patterns → Stats → RiskManager → Decision
```

Each agent sees previous results for intelligent decision-making.

### 🎯 **Decision Fusion**

Weighted aggregation with confidence-adjusted scoring:
- Risk Manager: 2.0x weight (highest priority)
- News Sentiment: 1.5x weight
- Market Structure: 1.5x weight
- Statistical Edge: 1.3x weight
- Multi-Timeframe: 1.3x weight
- ... (see PIPELINE_README.md)

### 🛡️ **Risk Management**

- Drawdown-based trading halts (>20% = full stop)
- Dynamic leverage adjustment based on volatility
- Per-trade risk limits
- Account balance tracking

### 📈 **Observability**

- Full pipeline execution tracking in database
- Per-agent timing and results
- HTTP health endpoints for all services
- Structured logging
- Admin dashboard (Next.js)

---

## API Endpoints

### Orchestrator (Port 4000)

```bash
# Health check
GET /health

# Trigger pipeline
POST /pipeline/run
  Body: {"accountId":"...","symbol":"BTCUSDT","timeframe":"1h"}

# View runs
GET /pipeline/runs?accountId=...

# Agent status
GET /agents/status

# Trade signals
GET /accounts/:id/trade-signals
```

### Agent Services (Ports 5001-5009)

```bash
# Health check
GET http://localhost:5001/health

# Execute agent
POST http://localhost:5001/run
  Body: PipelineContext (accountId, symbol, marketData, agentResults)

# Service info
GET http://localhost:5001/info
```

---

## Configuration

### Environment Variables

```env
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Agent Mode
AGENT_MODE=pipeline           # "pipeline" or "interval"
USE_HTTP_AGENTS=false         # true for microservices

# Agent Services
AGENT_SERVICES_BASE_URL=http://localhost

# Trading
TEST_ACCOUNT_ID=00000000-0000-0000-0000-000000000001
EXEC_VENUE=bybit             # "bybit" or "binance-futures"

# AI Model
GEMINI_API_KEY=your_key

# Pipeline Scheduler
PIPELINE_INTERVAL_MS=3600000  # 1 hour
```

---

## Testing

### Unit Test Agents

```bash
npm run pipeline:test
```

### Test Microservices

```bash
./scripts/test-microservices.sh
```

### Manual Test

```bash
# Start services
npm run agents:start

# Check health
npm run agents:health

# Trigger pipeline
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"accountId":"...","useHttpAgents":true}'
```

---

## Monitoring

### Health Checks

```bash
# All agents
npm run agents:health

# Specific service
curl http://localhost:5001/health
```

### Logs

```bash
# All agent logs
tail -f logs/*.log

# Specific agent
tail -f logs/market-structure.log

# Docker logs
docker-compose -f docker-compose.microservices.yml logs -f
```

### Database Queries

```sql
-- Latest pipeline runs
SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT 10;

-- Agent performance
SELECT * FROM pipeline_run_summaries ORDER BY created_at DESC;

-- Trade signals
SELECT * FROM trade_signals WHERE account_id = '...' 
ORDER BY created_at DESC LIMIT 20;
```

---

## Documentation

- **[QUICKSTART_PIPELINE.md](QUICKSTART_PIPELINE.md)** - Step-by-step getting started
- **[PIPELINE_README.md](PIPELINE_README.md)** - Pipeline architecture deep dive
- **[MICROSERVICES_GUIDE.md](MICROSERVICES_GUIDE.md)** - Microservices setup and operations

---

## Development

### Add New Agent

See PIPELINE_README.md "Extending the System" section.

### Modify Decision Fusion

Edit `src/pipeline/pipeline_orchestrator.ts` → `fuseDecision()`.

### Change Agent Weights

Edit weights in `fuseDecision()`:

```typescript
const weights: Record<string, number> = {
  "market-structure": 1.5,
  "my-new-agent": 2.0,  // Add here
  // ...
};
```

---

## Production Deployment

### Option 1: Docker Compose

```bash
docker-compose -f docker-compose.microservices.yml up -d
```

### Option 2: Kubernetes

See MICROSERVICES_GUIDE.md for Kubernetes manifests.

### Option 3: Cloud (AWS/GCP/Azure)

Deploy each service as:
- AWS: ECS/Fargate
- GCP: Cloud Run
- Azure: Container Apps

---

## Troubleshooting

### Agents return score=0

Normal if market data unavailable. Check:
```bash
curl https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1
```

### Service won't start

```bash
# Check port usage
lsof -i :5001

# Kill and restart
npm run agents:stop
npm run agents:start
```

### Pipeline fails

```bash
# Check account exists
SELECT * FROM trading_accounts WHERE id = '...';

# Check Redis
redis-cli ping

# View logs
tail -f logs/*.log
```

---

## Safety Disclaimer

**This system does NOT guarantee profit.** Trading is risky. Features:
- Testnet support for safe testing
- Risk limits and drawdown protection
- Full observability for analysis

Always start with paper trading.

---

## License

ISC

---

## Support

- Issues: GitHub Issues
- Docs: See `/docs` folder
- Logs: `logs/` directory
- Health: `http://localhost:4000/health`
