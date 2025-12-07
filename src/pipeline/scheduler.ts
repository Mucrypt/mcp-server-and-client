/**
 * Pipeline Scheduler
 * 
 * Triggers pipeline runs on a schedule (e.g., every hour).
 * 
 * Usage:
 *   node dist/pipeline/scheduler.js
 * 
 * Environment variables:
 *   - TEST_ACCOUNT_ID: The trading account to run pipelines for
 *   - PIPELINE_SYMBOL: Symbol to trade (default: BTCUSDT)
 *   - PIPELINE_TIMEFRAME: Timeframe (default: 1h)
 *   - PIPELINE_INTERVAL_MS: How often to run pipeline (default: 3600000 = 1 hour)
 */

import "dotenv/config";
import { runPipelineOnce } from "./pipeline_orchestrator.js";

const TEST_ACCOUNT_ID = process.env.TEST_ACCOUNT_ID ?? "00000000-0000-0000-0000-000000000001";
const SYMBOL = process.env.PIPELINE_SYMBOL ?? "BTCUSDT";
const TIMEFRAME = process.env.PIPELINE_TIMEFRAME ?? "1h";
const INTERVAL_MS = Number(process.env.PIPELINE_INTERVAL_MS ?? 3600000); // 1 hour
const USE_HTTP_AGENTS = process.env.USE_HTTP_AGENTS === "true";

async function runScheduledPipeline() {
  console.log(`\n⏰ Scheduler: Starting pipeline run at ${new Date().toISOString()}`);
  console.log(`   Account: ${TEST_ACCOUNT_ID}`);
  console.log(`   Symbol: ${SYMBOL}`);
  console.log(`   Timeframe: ${TIMEFRAME}`);
  console.log(`   Mode: ${USE_HTTP_AGENTS ? "Microservices (HTTP)" : "Monolithic (local)"}`);

  try {
    const runId = await runPipelineOnce(TEST_ACCOUNT_ID, SYMBOL, TIMEFRAME, USE_HTTP_AGENTS);
    
    if (runId) {
      console.log(`✅ Pipeline run ${runId} completed successfully`);
    } else {
      console.error(`❌ Pipeline run failed`);
    }
  } catch (err: any) {
    console.error(`❌ Scheduler error:`, err?.message ?? err);
  }

  console.log(`⏰ Next run in ${INTERVAL_MS / 1000 / 60} minutes`);
}

async function main() {
  console.log("🚀 Pipeline Scheduler started");
  console.log(`   Interval: ${INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`   Account: ${TEST_ACCOUNT_ID}`);
  console.log(`   Symbol: ${SYMBOL}`);
  console.log(`   Timeframe: ${TIMEFRAME}`);
  console.log(`   Mode: ${USE_HTTP_AGENTS ? "Microservices (HTTP)" : "Monolithic (local)"}`);

  // Run immediately on startup
  await runScheduledPipeline();

  // Then run on interval
  setInterval(async () => {
    await runScheduledPipeline();
  }, INTERVAL_MS);
}

main().catch(err => {
  console.error("Fatal scheduler error:", err);
  process.exit(1);
});
