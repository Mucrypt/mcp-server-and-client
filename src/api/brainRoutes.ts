import express from "express";
import { multiAI } from "../ai/multiAIProvider";
import { supabase } from "../core/supabase";
import { performanceTracker } from "../ai/tradingPerformanceTracker";

const router = express.Router();

// Brain status endpoint
router.get("/brain-status", async (_req, res) => {
  try {
    const aiStatus = multiAI.getStatus();
    
    // Get recent brain decisions
    const { data: decisions, error } = await supabase
      .from("brain_decisions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching brain decisions:", error);
    }

    // Calculate daily P&L from decisions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayDecisions } = await supabase
      .from("brain_decisions")
      .select("daily_pnl")
      .gte("created_at", today.toISOString());

    const dailyPnL = todayDecisions?.reduce((sum, d) => {
      return sum + (Number(d.daily_pnl) || 0);
    }, 0) || 0;

    res.json({
      aiProviders: {
        gemini: aiStatus.gemini,
        openai: aiStatus.openai,
        deepseek: aiStatus.deepseek,
        activeCount: aiStatus.activeCount
      },
      isRunning: false, // TODO: Track brain running state
      dailyPnL,
      recentDecisions: decisions || [],
      lastCheck: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Control brain (start/stop)
router.post("/brain-control", async (req, res) => {
  try {
    const { action, config } = req.body;
    
    if (action === "start") {
      // TODO: Implement brain start logic
      res.json({ 
        success: true, 
        message: "Brain started successfully",
        config 
      });
    } else if (action === "stop") {
      // TODO: Implement brain stop logic
      res.json({ 
        success: true, 
        message: "Brain stopped successfully" 
      });
    } else {
      res.status(400).json({ error: "Invalid action" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get brain decisions
router.get("/brain-decisions", async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    
    const { data, error } = await supabase
      .from("brain_decisions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with AI
router.post("/message", async (req, res) => {
  try {
    const { message, accountId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get trading context
    let tradingContext: any = {};
    
    if (accountId) {
      const { data: account } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("id", accountId)
        .maybeSingle();

      const { data: signals } = await supabase
        .from("trade_signals")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(5);

      tradingContext = {
        account,
        activeTradesCount: signals?.length || 0
      };
    }

    const response = await multiAI.getChatAdvice(message, tradingContext);

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI consensus on a specific market
router.post("/analyze-market", async (req, res) => {
  try {
    const { symbol, accountId } = req.body;

    // Get latest agent signals for this symbol
    const { data: signals } = await supabase
      .from("agent_signals")
      .select("*")
      .eq("account_id", accountId)
      .eq("symbol", symbol)
      .order("created_at", { ascending: false })
      .limit(20);

    // Mock market data (you'll want to get real data from your exchange)
    const marketData = {
      symbol,
      close: 45000, // Replace with real price
      volume: 1000000,
      change24h: 2.5
    };

    const analysis = await multiAI.analyzeMarket({
      agentName: "AdminDashboard",
      marketData,
      technicalIndicators: signals
    });

    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 Performance Tracking Endpoints

// Get performance metrics
router.get("/performance/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const days = Number(req.query.days ?? 30);
    
    const tracker = performanceTracker(accountId);
    const metrics = await tracker.getPerformanceMetrics(days);
    
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading insights
router.get("/insights/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const tracker = performanceTracker(accountId);
    const insights = await tracker.generateInsights();
    
    res.json(insights);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading journal summary
router.get("/journal/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const days = Number(req.query.days ?? 7);
    
    const tracker = performanceTracker(accountId);
    const journal = await tracker.getJournalSummary(days);
    
    res.json({ summary: journal });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze losing trades
router.get("/analyze-losses/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const limit = Number(req.query.limit ?? 20);
    
    const tracker = performanceTracker(accountId);
    const analysis = await tracker.analyzeLosingTrades(limit);
    
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
