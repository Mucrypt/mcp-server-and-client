#!/bin/bash

echo "🚀 Autonomous Trading Brain - Quick Setup"
echo "=========================================="
echo ""
echo "Goal: Make €100/day with AI-powered trading"
echo ""

# Step 1: Check Node.js
echo "✓ Checking Node.js..."
node --version

# Step 2: Install dependencies
echo ""
echo "📦 Installing AI dependencies..."
npm install

# Step 3: Setup instructions
echo ""
echo "⚙️  SETUP INSTRUCTIONS:"
echo ""
echo "1️⃣  Get your FREE Gemini API key:"
echo "   → Visit: https://aistudio.google.com/app/apikey"
echo "   → Click 'Create API Key'"
echo "   → Copy the key"
echo ""

echo "2️⃣  (Optional) Get OpenAI API key:"
echo "   → Visit: https://platform.openai.com/api-keys"
echo "   → Create new secret key"
echo "   → You'll need to add $5-10 credits"
echo ""

echo "3️⃣  (Optional) Get DeepSeek API key:"
echo "   → Visit: https://platform.deepseek.com/api_keys"
echo "   → Create API key (very cheap!)"
echo ""

echo "4️⃣  Update your .env file:"
echo "   → Open: .env"
echo "   → Add: GEMINI_API_KEY=your_actual_key_here"
echo "   → Add: OPENAI_API_KEY=your_actual_key_here (optional)"
echo "   → Add: DEEPSEEK_API_KEY=your_actual_key_here (optional)"
echo ""

echo "5️⃣  Create database table:"
echo "   → Go to Supabase SQL Editor"
echo "   → Run this SQL:"
echo ""
cat << 'EOF'
CREATE TABLE IF NOT EXISTS brain_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES trading_accounts(id),
  action TEXT NOT NULL,
  reasoning TEXT,
  metadata JSONB,
  daily_pnl NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brain_decisions_account ON brain_decisions(account_id);
CREATE INDEX idx_brain_decisions_created ON brain_decisions(created_at DESC);
EOF
echo ""

echo "6️⃣  Start the system:"
echo "   Terminal 1: npm run server:dev  (Backend API)"
echo "   Terminal 2: cd mukulah-ai-admin && npm run dev  (Dashboard)"
echo "   Terminal 3: npm run brain:start  (Trading Brain)"
echo ""

echo "🎯 PROFIT STRATEGY:"
echo "   ✓ Multi-AI validates every trade (3 AIs must agree)"
echo "   ✓ Only trades with 66%+ AI consensus"
echo "   ✓ Automatic stop-loss and take-profit"
echo "   ✓ Daily loss limit protection"
echo "   ✓ Position sizing based on risk"
echo ""

echo "📊 Monitor your progress at:"
echo "   → http://localhost:3001/dashboard"
echo "   → http://localhost:3001/chat (Talk to AI)"
echo ""

echo "🚀 Ready to make €100/day!"
echo "=========================================="
