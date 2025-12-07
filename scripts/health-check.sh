#!/bin/bash

# Health check for all agent services

echo "🏥 Checking health of all agent services..."
echo ""

all_healthy=true

for port in {5001..5009}; do
  response=$(curl -sf http://localhost:$port/health 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    agent=$(echo $response | grep -o '"agent":"[^"]*' | cut -d'"' -f4)
    echo "✅ Port $port ($agent): healthy"
  else
    echo "❌ Port $port: not responding"
    all_healthy=false
  fi
done

echo ""
if [ "$all_healthy" = true ]; then
  echo "✅ All services healthy"
  exit 0
else
  echo "❌ Some services are down"
  exit 1
fi
