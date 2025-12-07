# 🎯 Quick Reference - AI Trading Dashboard

## 🚀 Start Commands

```bash
# Terminal 1: Backend
npm run server:dev

# Terminal 2: Dashboard  
cd mukulah-ai-admin && npm run dev

# Terminal 3: Trading Brain (after setup)
npm run brain:start
```

## 🌐 URLs

- **Dashboard**: http://localhost:3001/dashboard
- **Settings**: http://localhost:3001/settings
- **API**: http://localhost:4000

## 🔑 Quick Setup

1. **Add Gemini Key** (FREE!)
   ```bash
   # In .env file:
   GEMINI_API_KEY=your_key_here
   ```
   Get key: https://aistudio.google.com/app/apikey

2. **Create Database Table**
   ```sql
   CREATE TABLE brain_decisions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     account_id UUID,
     action TEXT,
     reasoning TEXT,
     metadata JSONB,
     daily_pnl NUMERIC(15,2),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Start Dashboard**
   ```bash
   npm run server:dev
   cd mukulah-ai-admin && npm run dev
   ```

## 📊 Dashboard Tabs

| Tab | Purpose | Key Features |
|-----|---------|--------------|
| **Overview** | Main dashboard | Status, equity, signals, pipeline |
| **AI Brain** | Control trading | Start/stop, config, AI status, P&L |
| **Market Analysis** | Get AI predictions | Analyze symbols, consensus, insights |
| **Settings** | Configure system | API keys, agents, risk, accounts |

## ⚙️ Default Settings

```javascript
{
  maxDailyLoss: 50,        // €50 max loss per day
  maxPositionSize: 5,      // 5% of account per trade
  minConfidence: 70,       // 70% AI confidence required
  stopLoss: 2,             // 2% stop loss
  takeProfit: 4,           // 4% take profit
  enableAutoTrading: false // Paper trading first
}
```

## 🎯 Daily Workflow

### Morning (5 min)
1. Open dashboard
2. Check overnight P&L
3. Review AI status
4. Read latest signals

### During Day (Passive)
- System trades automatically
- Monitor from dashboard
- Get mobile notifications

### Evening (10 min)
1. Review daily P&L
2. Check win rate
3. Analyze AI decisions
4. Adjust settings if needed

## 🚨 Important Alerts

| Alert | Meaning | Action |
|-------|---------|--------|
| 🟢 High Consensus | 90%+ AI agreement | Good trade opportunity |
| 🟡 Medium Consensus | 66-89% agreement | Normal trade |
| 🔴 Low Consensus | <66% agreement | No trade executed |
| ⚠️ Daily Loss Limit | Max loss reached | Trading paused until tomorrow |
| ⚠️ No AI Configured | Missing API keys | Add Gemini key minimum |
| ✅ Target Reached | €100 profit | Excellent! Consider stopping |

## 💰 Profit Targets

| Week | Target | Position Size | Confidence |
|------|--------|---------------|------------|
| 1 | €30-50/day | 3% | 75% |
| 2 | €50-70/day | 4% | 72% |
| 3 | €70-90/day | 5% | 70% |
| 4 | €100+/day | 5% | 70% |

## 🔧 Common Tasks

### Add API Key
1. Settings → API Keys tab
2. Click link to get key
3. Add to `.env` file
4. Restart backend

### Start Trading
1. AI Brain tab
2. Configure settings
3. Enable Auto Trading
4. Click "Start Brain"

### Analyze Market
1. Market Analysis tab
2. Select symbol (BTC, ETH, etc.)
3. Click "Analyze Market"
4. Review AI consensus

### Check Performance
1. Overview tab
2. View Daily P&L card
3. Check equity chart
4. Review recent signals

### Adjust Risk
1. Settings → Risk Management
2. Move sliders
3. Click "Save"
4. Changes apply immediately

## 📱 Mobile Access

Dashboard is fully responsive:
- ✅ Works on phone/tablet
- ✅ Touch-friendly controls
- ✅ Same features as desktop
- ✅ Monitor anywhere

## 🆘 Quick Fixes

### Dashboard not loading?
```bash
# Check backend is running
npm run server:dev

# Check frontend is running
cd mukulah-ai-admin && npm run dev
```

### AI Brain not starting?
1. Check API keys in Settings
2. Verify at least 1 AI configured
3. Check console for errors

### No trades executing?
1. Enable Auto Trading
2. Check daily loss limit
3. Verify AI confidence threshold
4. Confirm market analysis shows signals

## 📚 Documentation

- **Full Guide**: `DASHBOARD_GUIDE.md`
- **AI Setup**: `AI_TRADING_README.md`
- **Integration**: `DASHBOARD_INTEGRATION.md`

## 💡 Pro Tips

1. ⭐ **Start with Gemini** - It's free!
2. ⭐ **Paper trade first** - Test for 1-2 weeks
3. ⭐ **Keep position size low** - 3-5% maximum
4. ⭐ **Require high confidence** - 70%+ recommended
5. ⭐ **Monitor daily** - Review P&L every evening
6. ⭐ **Add more AIs** - Better consensus = higher win rate
7. ⭐ **Use stop-loss always** - Protect your capital
8. ⭐ **Let it run 24/7** - Don't micromanage

## 🎉 Success Checklist

- [ ] Backend running (port 4000)
- [ ] Dashboard running (port 3001)
- [ ] Gemini API key added
- [ ] Brain_decisions table created
- [ ] Settings configured
- [ ] Risk limits set
- [ ] Paper trading tested
- [ ] Ready for live trading!

---

**Need help? Check the full guides or review the code comments!**

**Happy Trading! 🚀💰**
