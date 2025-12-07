/**
 * AI Chat API - Talk to your trading brain
 * 
 * Endpoints:
 * POST /api/chat/message - Send message to AI
 * GET /api/chat/brain-status - Get autonomous brain status
 * POST /api/chat/brain-control - Start/stop autonomous trading
 */

import { Router } from "express";
import { aiProvider } from "../ai/aiProvider";
import { AutonomousTradingBrain, TradingConfig } from "../ai/autonomousBrain";
import { supabase } from "../core/supabase";

const router = Router();

// Store active brain instance
let tradingBrain: AutonomousTradingBrain | null = null;

/**
 * POST /api/chat/message
 * Chat with AI about trading strategy
 */
router.post("/message", async (req, res) => {
  try {
    const { message, accountId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get trading context
    const context = await getTradingContext(accountId || process.env.TEST_ACCOUNT_ID);

    // Get AI response
    const aiResponse = await aiProvider.getChatAdvice(message, context);

    // Log chat interaction
    await supabase.from("brain_decisions").insert({
      account_id: accountId || process.env.TEST_ACCOUNT_ID,
      action: "CHAT_INTERACTION",
      reasoning: `User: ${message}\n\nAI: ${aiResponse}`,
      metadata: { type: "chat" }
    });

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/brain-status
 * Get status of autonomous trading brain
 */
router.get("/brain-status", async (req, res) => {
  try {
    if (!tradingBrain) {
      return res.json({
        running: false,
        message: "Autonomous brain not initialized"
      });
    }

    const status = tradingBrain.getStatus();
    
    // Get recent decisions
    const { data: recentDecisions } = await supabase
      .from("brain_decisions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    res.json({
      ...status,
      recentDecisions
    });
  } catch (error: any) {
    console.error("Brain status error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/brain-control
 * Start or stop the autonomous trading brain
 */
router.post("/brain-control", async (req, res) => {
  try {
    const { action, config } = req.body;

    if (action === "start") {
      if (tradingBrain?.getStatus().running) {
        return res.json({ 
          message: "Autonomous brain already running",
          status: tradingBrain.getStatus()
        });
      }

      // Create config from request or use defaults
      const tradingConfig: TradingConfig = {
        accountId: config?.accountId || process.env.TEST_ACCOUNT_ID || "",
        maxDailyLoss: config?.maxDailyLoss || 100, // $100 default
        maxPositionSize: config?.maxPositionSize || 10, // 10% of account
        minConfidence: config?.minConfidence || 65, // 65% confidence minimum
        enableAutoTrading: config?.enableAutoTrading !== false, // true by default
        tradingPairs: config?.tradingPairs || ["BTCUSDT", "ETHUSDT"],
        checkInterval: config?.checkInterval || 5 * 60 * 1000 // 5 minutes
      };

      tradingBrain = new AutonomousTradingBrain(tradingConfig);
      tradingBrain.start();

      res.json({
        message: "✅ Autonomous trading brain started!",
        config: tradingConfig,
        status: tradingBrain.getStatus()
      });
    } else if (action === "stop") {
      if (!tradingBrain) {
        return res.json({ message: "No autonomous brain running" });
      }

      tradingBrain.stop();
      
      res.json({
        message: "⏹️  Autonomous trading brain stopped",
        finalStatus: tradingBrain.getStatus()
      });
    } else {
      res.status(400).json({ error: "Invalid action. Use 'start' or 'stop'" });
    }
  } catch (error: any) {
    console.error("Brain control error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/brain-decisions
 * Get recent autonomous trading decisions
 */
router.get("/brain-decisions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const accountId = req.query.accountId || process.env.TEST_ACCOUNT_ID;

    const { data, error } = await supabase
      .from("brain_decisions")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("Get decisions error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Get trading context for AI
 */
async function getTradingContext(accountId: string) {
  // Get account info
  const { data: account } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  // Get recent signals
  const { data: recentSignals } = await supabase
    .from("trade_signals")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get active agents (from config or default list)
  const activeAgents = [
    "market-structure",
    "order-flow",
    "momentum",
    "volatility-regime",
    "news-sentiment",
    "multi-timeframe",
    "pattern-recognition",
    "statistical-edge",
    "risk-manager"
  ];

  // Get recent brain decisions
  const { data: recentDecisions } = await supabase
    .from("brain_decisions")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    account,
    recentSignals,
    activeAgents,
    recentDecisions,
    brainStatus: tradingBrain?.getStatus() || { running: false }
  };
}

export default router;
