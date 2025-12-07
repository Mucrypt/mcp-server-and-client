/**
 * Start the Autonomous Trading Brain
 * Goal: €100/day profit with Multi-AI validation
 */

import { AutonomousTradingBrain, TradingConfig } from "./src/ai/autonomousBrain";

const config: TradingConfig = {
  accountId: process.env.TEST_ACCOUNT_ID || "00000000-0000-0000-0000-000000000001",
  
  // Risk Management
  maxDailyLoss: 50, // Stop trading if lose €50 in a day
  maxPositionSize: 5, // Max 5% of account per trade
  minConfidence: 70, // Only trade if AI consensus is 70%+
  
  // Trading Settings
  enableAutoTrading: true, // Set to false for paper trading
  tradingPairs: ["BTCUSDT", "ETHUSDT"], // Cryptocurrencies to trade
  checkInterval: 5 * 60 * 1000, // Check every 5 minutes
};

console.log("🚀 Starting Autonomous Trading Brain...\n");
console.log("💰 Daily Profit Goal: €100");
console.log(`🛡️  Daily Loss Limit: €${config.maxDailyLoss}`);
console.log(`📊 Trading Pairs: ${config.tradingPairs.join(", ")}`);
console.log(`🎯 Min AI Confidence: ${config.minConfidence}%`);
console.log(`⚙️  Auto-Trading: ${config.enableAutoTrading ? "ENABLED ✓" : "DISABLED (Paper Mode)"}\n`);

const brain = new AutonomousTradingBrain(config);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Stopping Trading Brain...");
  brain.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⏹️  Stopping Trading Brain...");
  brain.stop();
  process.exit(0);
});

// Start the brain!
brain.start().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
