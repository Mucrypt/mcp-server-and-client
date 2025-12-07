#!/bin/bash

echo "🚀 Setting up AI-Powered Autonomous Trading Brain..."
echo ""

# Install AI dependencies
echo "📦 Installing AI SDK..."
npm install @google/generative-ai

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file first"
    exit 1
fi

# Check for API key
if grep -q "GEMINI_API_KEY=your_gemini_api_key_here" .env; then
    echo "⚠️  WARNING: GEMINI_API_KEY not configured!"
    echo ""
    echo "To enable AI features:"
    echo "1. Get API key from https://makersuite.google.com/app/apikey"
    echo "2. Update GEMINI_API_KEY in .env file"
    echo ""
fi

# Apply database migration
echo ""
echo "📊 Database migration:"
echo "Please run this SQL in your Supabase SQL Editor:"
echo "---"
cat migrations/006_brain_decisions.sql
echo "---"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure GEMINI_API_KEY in .env"
echo "2. Run database migration in Supabase"
echo "3. Start backend: npm run server:dev"
echo "4. Start dashboard: cd mukulah-ai-admin && npm run dev"
echo "5. Open http://localhost:3001/chat"
echo ""
echo "📖 Read AI_TRADING_SETUP.md for full documentation"
