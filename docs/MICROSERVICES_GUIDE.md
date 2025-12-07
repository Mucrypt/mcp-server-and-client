# Microservices Architecture Guide

## Overview

Your AI trading system now supports **true microservices architecture** where each agent runs as an independent HTTP service. This enables:

- **Horizontal Scaling**: Scale individual agents independently
- **Fault Isolation**: One agent failure doesn't crash the system
- **Language Flexibility**: Replace agents with services in any language
- **Easy Monitoring**: Each service has its own health endpoint
- **Distributed Deployment**: Run agents on different machines

## Architecture Diagram

```
┌─────────────────┐
│   Orchestrator  │  (Port 4000)
│   + HTTP API    │
└────────┬────────┘
         │
         │ HTTP Calls
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    ▼                                     ▼
┌────────────┐                    ┌────────────┐
│  Agent 1   │  (Port 5001)       │  Agent 9   │  (Port 5009)
│  Market    │                    │  Risk      │
│  Structure │                    │  Manager   │
└────────────┘                    └────────────┘
```

## Running Modes

### Mode 1: Monolithic (Default)

All agents run as local instances in the orchestrator process.

```bash
# .env
USE_HTTP_AGENTS=false

# Start
npm run server:dev
```

**Pros**: Simple, fast, single process  
**Cons**: No isolation, can't scale individual agents

---

### Mode 2: Microservices (Local)

Agents run as separate processes on localhost.

```bash
# Terminal 1: Start all agent services
npm run agents:start

# Terminal 2: Start orchestrator
USE_HTTP_AGENTS=true npm run server:dev

# Terminal 3 (optional): Start scheduler
USE_HTTP_AGENTS=true npm run pipeline:scheduler
```

**Pros**: Fault isolation, can restart individual agents  
**Cons**: More complex, more memory usage

---

### Mode 3: Docker Microservices

Full containerized deployment with Docker Compose.

```bash
docker-compose -f docker-compose.microservices.yml up --build
```

**Pros**: Production-ready, easy to deploy, scalable  
**Cons**: Requires Docker, slower startup

---

## Agent Services

Each agent service runs on a dedicated port and exposes:

| Agent                | Port | Description                        |
|----------------------|------|------------------------------------|
| market-structure     | 5001 | Trend identification (MA-based)    |
| order-flow           | 5002 | Volume analysis                    |
| momentum             | 5003 | RSI-based momentum                 |
| volatility-regime    | 5004 | ATR volatility classification      |
| news-sentiment       | 5005 | News sentiment analysis            |
| multi-timeframe      | 5006 | Cross-timeframe trend alignment    |
| pattern-recognition  | 5007 | Chart pattern detection            |
| statistical-edge     | 5008 | Mean reversion (Z-score)           |
| risk-manager         | 5009 | Account drawdown protection        |

### Service Endpoints

Each service has:

- **GET /health** - Health check
  ```bash
  curl http://localhost:5001/health
  # Response: {"status":"ok","agent":"market-structure","timestamp":"..."}
  ```

- **POST /run** - Process pipeline context
  ```bash
  curl -X POST http://localhost:5001/run \
    -H "Content-Type: application/json" \
    -d '{"accountId":"...","symbol":"BTCUSDT","timeframe":"1h",...}'
  # Response: {"score":0.6,"confidence":75,"payload":{...},"meta":{...}}
  ```

- **GET /info** - Service information
  ```bash
  curl http://localhost:5001/info
  # Response: {"name":"market-structure","version":"1.0.0","endpoints":{...}}
  ```

## Management Scripts

### Start All Agents

```bash
npm run agents:start
```

Starts all 9 agent services in background. Logs go to `logs/*.log`.

### Stop All Agents

```bash
npm run agents:stop
```

Kills all agent service processes.

### Health Check

```bash
npm run agents:health
```

Checks if all services are responding.

### View Logs

```bash
# All logs
tail -f logs/*.log

# Specific agent
tail -f logs/market-structure.log
```

## Configuration

### Environment Variables

```env
# Microservices toggle
USE_HTTP_AGENTS=true

# Base URL for agent services
AGENT_SERVICES_BASE_URL=http://localhost

# For Docker deployment
AGENT_SERVICES_BASE_URL=http://host.docker.internal
```

### Custom Agent Ports

Edit `src/services/*-service.ts` to change ports:

```typescript
class MyAgentService extends AgentServiceBase {
  constructor() {
    super("my-agent", 5010); // Change port here
  }
}
```

Update `src/pipeline/http-agent-client.ts` accordingly.

## Development Workflow

### 1. Develop Agent Locally

```bash
# Edit agent logic
vim src/services/market-structure-service.ts

# Test locally (monolithic mode)
USE_HTTP_AGENTS=false npm run server:dev
```

### 2. Test as Microservice

```bash
# Start just this agent
tsx src/services/market-structure-service.ts

# In another terminal, trigger pipeline
curl -X POST http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"accountId":"...","useHttpAgents":true}'
```

### 3. Deploy to Production

```bash
# Build
npm run server:build

# Run with Docker
docker-compose -f docker-compose.microservices.yml up -d

# Check status
docker-compose -f docker-compose.microservices.yml ps
```

## Monitoring

### Service Health

```bash
# Check all at once
npm run agents:health

# Check orchestrator
curl http://localhost:4000/health

# Check specific agent
curl http://localhost:5001/health
```

### Logs

In Docker:
```bash
docker-compose -f docker-compose.microservices.yml logs -f market-structure
```

Local:
```bash
tail -f logs/market-structure.log
```

### Metrics

Each agent response includes metadata:

```json
{
  "score": 0.6,
  "confidence": 75,
  "payload": {...},
  "meta": {
    "agent": "market-structure",
    "duration_ms": 145,
    "timestamp": "2025-12-06T10:30:00.000Z"
  }
}
```

## Troubleshooting

### Agent Service Won't Start

```bash
# Check if port is in use
lsof -i :5001

# Kill existing process
kill -9 $(lsof -ti:5001)

# Restart
tsx src/services/market-structure-service.ts
```

### Orchestrator Can't Reach Agents

```bash
# Test connectivity
curl http://localhost:5001/health

# Check firewall
sudo ufw status

# Verify USE_HTTP_AGENTS is true
echo $USE_HTTP_AGENTS
```

### Docker Services Failing

```bash
# View logs
docker-compose -f docker-compose.microservices.yml logs

# Rebuild
docker-compose -f docker-compose.microservices.yml up --build

# Check network
docker network inspect mcp-server-and-client_default
```

### Pipeline Returns All Zeros

This happens when agents can't fetch market data. Check:

```bash
# Test Binance API access
curl https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1

# Check agent logs for errors
tail -f logs/*.log | grep -i error
```

## Performance Optimization

### 1. Parallel Agent Calls

Currently agents run sequentially. For independent agents, modify orchestrator to call in parallel:

```typescript
// Instead of:
for (const name of pipelineOrder) {
  await runStep(runId, name, agent, context);
}

// Use:
await Promise.all(
  independentAgents.map(name => runStep(runId, name, agents[name], context))
);
```

### 2. Caching

Agents already cache market data via Redis. Tune TTL in `dataFeed.ts`:

```typescript
await redisClient.setex(cacheKey, 10, JSON.stringify(data)); // 10 seconds
```

### 3. Timeouts

Adjust HTTP timeouts in `http-agent-client.ts`:

```typescript
new HttpAgentClient({
  name: "market-structure",
  url: "http://localhost:5001",
  timeout: 60000 // 60 seconds
});
```

## Scaling

### Horizontal Scaling (Multiple Instances)

Use a load balancer:

```yaml
# docker-compose.microservices.yml
market-structure:
  deploy:
    replicas: 3
  # ... rest of config
```

Add load balancer (nginx/traefik) in front.

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-structure-agent
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: your-registry/market-structure:latest
        ports:
        - containerPort: 5001
        env:
        - name: REDIS_URL
          value: redis://redis-service:6379
---
apiVersion: v1
kind: Service
metadata:
  name: market-structure
spec:
  selector:
    app: market-structure-agent
  ports:
  - port: 5001
```

## Migration Checklist

Moving from monolithic to microservices:

- [ ] Set `USE_HTTP_AGENTS=true` in `.env`
- [ ] Start all agent services: `npm run agents:start`
- [ ] Verify health: `npm run agents:health`
- [ ] Test pipeline: `npm run pipeline:test`
- [ ] Monitor logs: `tail -f logs/*.log`
- [ ] Update monitoring dashboards
- [ ] Configure alerts for service failures
- [ ] Set up CI/CD for individual services
- [ ] Document service dependencies
- [ ] Plan rollback strategy

## Next Steps

1. **Add Authentication**: Secure agent endpoints with API keys
2. **Service Discovery**: Use Consul/etcd for dynamic agent registration
3. **Circuit Breakers**: Handle agent failures gracefully
4. **Rate Limiting**: Prevent agent abuse
5. **Distributed Tracing**: Add OpenTelemetry for request tracking
6. **Auto-scaling**: Scale agents based on load metrics

## Resources

- Service logs: `logs/`
- Health endpoints: `http://localhost:500[1-9]/health`
- Orchestrator API: `http://localhost:4000`
- Admin dashboard: `http://localhost:3001/dashboard`

