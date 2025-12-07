#!/bin/bash

# Stop All Agent Services

echo "🛑 Stopping all agent microservices..."

for port in {5001..5009}; do
  pids=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "✅ All agent services stopped"
