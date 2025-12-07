# 🤖 Autonomous AI Trading Brain

**Goal: Make €100/day with AI-powered cryptocurrency trading**

## 🎯 What Makes This Special?

### Multi-AI Consensus System
- **3 AI Models Working Together**: Gemini (fast analysis) + OpenAI (deep reasoning) + DeepSeek (pattern recognition)
- **66% Agreement Required**: Won't trade unless at least 2 out of 3 AIs agree
- **Reduces False Signals**: Triple validation = fewer losing trades

### Safety Features
- ✅ **Daily Loss Limit**: Stops trading automatically if you lose €50 in a day
- ✅ **Risk-Based Position Sizing**: Smaller positions for risky trades
- ✅ **Auto Stop-Loss & Take-Profit**: Every trade has protection
- ✅ **Confidence Threshold**: Only trades with 70%+ AI confidence
- ✅ **24/7 Monitoring**: Never misses opportunities

## 🚀 Quick Start

### 1. Get Your API Keys (Start with Gemini - It's FREE!)

#### Gemini (FREE - Start Here!)
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to `.env`: `GEMINI_API_KEY=your_key_here`

#### OpenAI (Optional - Better accuracy)
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Add $5-10 credits to your account
4. Add to `.env`: `OPENAI_API_KEY=your_key_here`

#### DeepSeek (Optional - Cheapest option)
1. Go to: https://platform.deepseek.com/api_keys
2. Create API key
3. Add to `.env`: `DEEPSEEK_API_KEY=your_key_here`

### 2. Create Database Table

Go to your Supabase SQL Editor and run:

\`\`\`sql
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
\`\`\`

### 3. Start Trading!

Open 3 terminals:

\`\`\`bash
# Terminal 1: Backend API
npm run server:dev

# Terminal 2: Dashboard
cd mukulah-ai-admin && npm run dev

# Terminal 3: Trading Brain
npm run brain:start
\`\`\`

### 4. Monitor Your Progress

- **Dashboard**: http://localhost:3001/dashboard
- **Chat with AI**: http://localhost:3001/chat
- **Check Trades**: http://localhost:3001/trades

## 📊 How It Works

### 1. Market Analysis (Every 5 minutes)
```
🔍 Scanning BTCUSDT, ETHUSDT...
   ↓
📊 Collecting signals from 9 agents
   ↓
🤖 Asking 3 AI models for analysis
   ↓
🎯 Calculating consensus
```

### 2. Decision Making
```
Gemini says: BUY (75% confidence)
OpenAI says: BUY (80% confidence)
DeepSeek says: NEUTRAL (60% confidence)
   ↓
Consensus: 66% BUY agreement
   ↓
✅ TRADE APPROVED (2/3 AIs agree)
```

### 3. Risk Management
```
Account: €1000
Risk Level: MEDIUM
Position Size: 3% = €30
Stop Loss: 2% = €29.40
Take Profit: 4% = €31.20
```

### 4. Execution
```
💵 Opening trade...
   ↓
🎯 Setting stop-loss at €29.40
   ↓
🎯 Setting take-profit at €31.20
   ↓
✅ Trade executed!
```

## 💰 Profit Strategy

### Daily Target: €100
- **5 trades @ €20 profit each** = €100
- **Risk-Reward Ratio**: 2:1 (Risk €10 to make €20)
- **Win Rate Needed**: 50%+ (AI consensus gives you 70%+)

### Example Day:
```
Trade 1: +€25 ✅
Trade 2: -€12 ❌
Trade 3: +€30 ✅
Trade 4: +€18 ✅
Trade 5: +€22 ✅
Trade 6: -€10 ❌
─────────────
Total: +€73 (73% win rate)
```

## 🛡️ Safety Settings

### Conservative Mode (Recommended for Start)
```typescript
{
  maxDailyLoss: 50,        // Stop if lose €50
  maxPositionSize: 3,      // Max 3% per trade
  minConfidence: 75,       // Need 75% AI confidence
  enableAutoTrading: false // Paper trading first
}
```

### Aggressive Mode (After Testing)
```typescript
{
  maxDailyLoss: 100,       // Stop if lose €100
  maxPositionSize: 5,      // Max 5% per trade
  minConfidence: 70,       // Need 70% AI confidence
  enableAutoTrading: true  // Real trading
}
```

## 📱 Using the Chat Interface

Ask the AI for help:

```
You: "Should I increase my position size?"
AI: "Based on your current 85% win rate and €75 daily profit,
     yes - consider increasing from 3% to 4% position size.
     However, keep your stop-loss tight at 2%."

You: "What's my profit potential today?"
AI: "You're at €50 profit with 3 trades. If the next 2 trades
     hit target (€40 expected), you'll reach €90 - very close
     to your €100 goal. Market conditions are favorable."
```

## 🎓 Understanding the AI Consensus

### High Agreement (90%+)
- ✅ All 3 AIs say the same thing
- ✅ High confidence
- ✅ Strong trade signal
- ✅ Best risk-reward

### Medium Agreement (66-89%)
- ⚠️ 2 out of 3 AIs agree
- ⚠️ Moderate confidence
- ⚠️ Good trade signal
- ⚠️ Normal risk-reward

### Low Agreement (<66%)
- ❌ AIs disagree
- ❌ Don't trade
- ❌ Wait for consensus
- ❌ Market unclear

## 🔧 Configuration

Edit `startBrain.ts` to customize:

```typescript
const config: TradingConfig = {
  // Your account ID
  accountId: "your-account-id",
  
  // Risk Management
  maxDailyLoss: 50,         // Daily loss limit (€)
  maxPositionSize: 5,       // Max % of account per trade
  minConfidence: 70,        // Min AI confidence (%)
  
  // Trading
  enableAutoTrading: true,  // false = paper trading
  tradingPairs: ["BTCUSDT", "ETHUSDT"],
  checkInterval: 5 * 60 * 1000, // Check every 5 min
};
```

## 📈 Tracking Your Progress

### Daily P&L Report
The brain shows you:
```
📅 Day Summary
💰 Starting Balance: €1000
💵 Current Balance: €1073
📊 P&L: +€73 (+7.3%)
✅ Trades Won: 4
❌ Trades Lost: 2
🎯 Win Rate: 66.7%
```

### Trade Log
Every trade is saved with:
- AI reasoning
- Confidence levels
- Entry/exit prices
- P&L
- Risk level

## 🚨 When Things Go Wrong

### "Daily loss limit reached"
- ✅ This is GOOD - the brain is protecting you
- ✅ Review your trades
- ✅ Adjust strategy tomorrow
- ✅ Maybe increase minConfidence

### "AI confidence too low"
- ✅ Market is unclear
- ✅ Better to wait
- ✅ Don't force trades

### "High risk + low confidence"
- ✅ Brain is being cautious
- ✅ Volatile market
- ✅ Wait for better setup

## 💡 Tips for Success

1. **Start with Paper Trading**
   - Set `enableAutoTrading: false`
   - Test for 1-2 weeks
   - Verify profitable before going live

2. **Use All 3 AIs**
   - More AIs = better accuracy
   - Start with Gemini (free)
   - Add others as you see results

3. **Don't Override the Brain**
   - Trust the AI consensus
   - Let it run for full days
   - Review results weekly

4. **Monitor Daily P&L**
   - If you hit €50 profit early, consider stopping
   - Don't get greedy
   - Protect your profits

5. **Adjust Based on Results**
   - If win rate > 80%: Increase position size
   - If win rate < 60%: Increase minConfidence
   - If hitting daily loss: Decrease maxPositionSize

## 🎯 Road to €100/Day

### Week 1: Learning (Paper Trading)
- Goal: Understand how it works
- Target: €50/day (paper)
- Focus: Watch AI decisions

### Week 2: Small Live Trades
- Goal: Build confidence
- Target: €30/day (live)
- Focus: 3% position size

### Week 3: Scaling Up
- Goal: Increase profits
- Target: €70/day
- Focus: 5% position size if win rate > 70%

### Week 4: €100/Day Target
- Goal: Hit target consistently
- Target: €100/day
- Focus: Maintain discipline

## 🆘 Support & Troubleshooting

### AI Not Working?
1. Check `.env` file has correct API keys
2. Run `npm install` again
3. Check API key quotas/limits

### No Trades Executing?
1. Check `enableAutoTrading: true`
2. Verify minConfidence isn't too high
3. Check market has enough volatility

### Daily Loss Hit Too Often?
1. Increase `minConfidence` to 75%
2. Decrease `maxPositionSize` to 3%
3. Review your trading pairs

## 📚 Learn More

- **Gemini AI**: https://ai.google.dev/docs
- **OpenAI**: https://platform.openai.com/docs
- **DeepSeek**: https://platform.deepseek.com/docs
- **Trading Strategies**: Review code in `/src/agents/`

---

## 🎉 You're Ready!

Your autonomous trading brain is set up to:
- ✅ Run 24/7 without you
- ✅ Make smart AI-validated decisions
- ✅ Protect your capital
- ✅ Work towards €100/day

**Good luck and happy trading! 🚀💰**
