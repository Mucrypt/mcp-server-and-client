#!/bin/bash

# Start All Agent Services
# 
# Starts each agent as a separate microservice process

echo "🚀 Starting all agent microservices..."

# Kill any existing services on these ports
echo "🧹 Cleaning up existing processes..."
for port in {5001..5009}; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Build TypeScript first
echo "📦 Building TypeScript..."
npm run server:build

# Start each service in background
echo ""
echo "Starting services..."

tsx src/services/market-structure-service.ts > logs/market-structure.log 2>&1 &
echo "✅ Market Structure Service (port 5001) - PID $!"

tsx src/services/order-flow-service.ts > logs/order-flow.log 2>&1 &
echo "✅ Order Flow Service (port 5002) - PID $!"

tsx src/services/momentum-service.ts > logs/momentum.log 2>&1 &
echo "✅ Momentum Service (port 5003) - PID $!"

tsx src/services/volatility-regime-service.ts > logs/volatility-regime.log 2>&1 &
echo "✅ Volatility Regime Service (port 5004) - PID $!"

tsx src/services/news-sentiment-service.ts > logs/news-sentiment.log 2>&1 &
echo "✅ News Sentiment Service (port 5005) - PID $!"

tsx src/services/multi-timeframe-service.ts > logs/multi-timeframe.log 2>&1 &
echo "✅ Multi Timeframe Service (port 5006) - PID $!"

tsx src/services/pattern-recognition-service.ts > logs/pattern-recognition.log 2>&1 &
echo "✅ Pattern Recognition Service (port 5007) - PID $!"

tsx src/services/statistical-edge-service.ts > logs/statistical-edge.log 2>&1 &
echo "✅ Statistical Edge Service (port 5008) - PID $!"

tsx src/services/risk-manager-service.ts > logs/risk-manager.log 2>&1 &
echo "✅ Risk Manager Service (port 5009) - PID $!"

echo ""
echo "⏳ Waiting for services to start..."
sleep 3

# Health check
echo ""
echo "🏥 Running health checks..."
all_healthy=true

for port in {5001..5009}; do
  if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
    echo "✅ Port $port: healthy"
  else
    echo "❌ Port $port: not responding"
    all_healthy=false
  fi
done

echo ""
if [ "$all_healthy" = true ]; then
  echo "✅ All agent services are running!"
  echo ""
  echo "View logs: tail -f logs/*.log"
  echo "Stop all: ./scripts/stop-agents.sh"
else
  echo "⚠️  Some services failed to start. Check logs in logs/ directory"
fi
