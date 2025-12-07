#!/bin/bash

# Quick Test for Microservices Setup

echo "🧪 Testing Microservices Setup"
echo "=============================="
echo ""

# 1. Build TypeScript
echo "1️⃣ Building TypeScript..."
npm run server:build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build successful"
echo ""

# 2. Start agents
echo "2️⃣ Starting agent services..."
./scripts/start-agents.sh
sleep 5
echo ""

# 3. Health checks
echo "3️⃣ Running health checks..."
all_healthy=true

for port in {5001..5009}; do
  response=$(curl -sf http://localhost:$port/health 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    agent=$(echo $response | grep -o '"agent":"[^"]*' | cut -d'"' -f4)
    echo "  ✅ $agent (port $port)"
  else
    echo "  ❌ Port $port not responding"
    all_healthy=false
  fi
done

if [ "$all_healthy" = false ]; then
  echo ""
  echo "❌ Some services failed to start"
  echo "Check logs: tail -f logs/*.log"
  exit 1
fi

echo ""
echo "4️⃣ Testing agent endpoint..."

# Test market-structure agent
response=$(curl -sf http://localhost:5001/run \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "test",
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "agentResults": {}
  }')

if [ $? -eq 0 ]; then
  echo "✅ Agent endpoint working"
  echo "Sample response: $response"
else
  echo "❌ Agent endpoint failed"
  ./scripts/stop-agents.sh
  exit 1
fi

echo ""
echo "5️⃣ Testing orchestrator with microservices..."

# Start orchestrator in background
USE_HTTP_AGENTS=true tsx src/server.ts > /tmp/orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!

sleep 5

# Test orchestrator
response=$(curl -sf http://localhost:4000/health 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "✅ Orchestrator started"
else
  echo "❌ Orchestrator failed to start"
  cat /tmp/orchestrator.log
  kill $ORCHESTRATOR_PID
  ./scripts/stop-agents.sh
  exit 1
fi

echo ""
echo "6️⃣ Triggering test pipeline run..."

response=$(curl -sf http://localhost:4000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "00000000-0000-0000-0000-000000000001",
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "useHttpAgents": true
  }')

if [ $? -eq 0 ]; then
  echo "✅ Pipeline triggered successfully"
  echo "Response: $response"
else
  echo "❌ Pipeline trigger failed"
  kill $ORCHESTRATOR_PID
  ./scripts/stop-agents.sh
  exit 1
fi

echo ""
echo "🧹 Cleaning up..."
kill $ORCHESTRATOR_PID
./scripts/stop-agents.sh

echo ""
echo "✅ All microservices tests passed!"
echo ""
echo "To run in production mode:"
echo "  1. npm run agents:start"
echo "  2. USE_HTTP_AGENTS=true npm run server:dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose -f docker-compose.microservices.yml up"
