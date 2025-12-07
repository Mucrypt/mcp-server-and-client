/**
 * Pipeline Test Script
 * 
 * Quick test to verify the pipeline orchestrator works correctly.
 * 
 * Usage:
 *   npm run server:build
 *   node dist/pipeline/test_pipeline.js
 */

import "dotenv/config";
import { runPipelineOnce } from "./pipeline_orchestrator.js";
import { supabase } from "../core/supabase.js";

const TEST_ACCOUNT_ID = process.env.TEST_ACCOUNT_ID ?? "00000000-0000-0000-0000-000000000001";

async function testPipeline() {
  console.log("🧪 Testing Pipeline Orchestrator\n");

  // 1. Check if account exists
  console.log("1️⃣ Checking trading account...");
  const { data: account, error: accErr } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("id", TEST_ACCOUNT_ID)
    .maybeSingle();

  if (accErr || !account) {
    console.error("❌ Trading account not found!");
    console.error("   Run this SQL in Supabase:");
    console.error(`
      INSERT INTO trading_accounts (id, name, starting_balance, current_balance, max_leverage, max_risk_per_trade)
      VALUES ('${TEST_ACCOUNT_ID}', 'Test Account', 10000, 10000, 10, 2);
    `);
    process.exit(1);
  }

  console.log(`✅ Account found: ${account.name} (balance: $${account.current_balance})\n`);

  // 2. Run pipeline
  console.log("2️⃣ Running pipeline...");
  const runId = await runPipelineOnce(TEST_ACCOUNT_ID, "BTCUSDT", "1h");

  if (!runId) {
    console.error("❌ Pipeline failed to start");
    process.exit(1);
  }

  console.log(`✅ Pipeline run created: ${runId}\n`);

  // 3. Wait a bit for completion
  console.log("3️⃣ Waiting for pipeline to complete...");
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

  // 4. Check results
  console.log("4️⃣ Checking results...");
  
  const { data: run, error: runErr } = await supabase
    .from("pipeline_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (runErr || !run) {
    console.error("❌ Failed to fetch pipeline run");
    process.exit(1);
  }

  console.log(`   Status: ${run.status}`);
  console.log(`   Started: ${run.created_at}`);
  console.log(`   Finished: ${run.finished_at ?? "still running..."}\n`);

  const { data: steps, error: stepErr } = await supabase
    .from("pipeline_steps")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (stepErr) {
    console.error("❌ Failed to fetch pipeline steps");
    process.exit(1);
  }

  console.log(`5️⃣ Agent Results (${steps?.length ?? 0} steps):\n`);

  for (const step of steps ?? []) {
    const duration = step.duration_ms ?? 0;
    const emoji = step.payload?.error ? "❌" : "✅";
    console.log(`   ${emoji} ${step.agent_name}`);
    console.log(`      Score: ${step.score.toFixed(3)}, Confidence: ${step.confidence.toFixed(1)}%`);
    console.log(`      Duration: ${duration}ms`);
    if (step.payload?.error) {
      console.log(`      Error: ${step.payload.error}`);
    }
    console.log();
  }

  // 6. Check trade signal
  const { data: signals, error: sigErr } = await supabase
    .from("trade_signals")
    .select("*")
    .eq("account_id", TEST_ACCOUNT_ID)
    .order("created_at", { ascending: false })
    .limit(1);

  if (sigErr) {
    console.error("❌ Failed to fetch trade signals");
  } else if (signals && signals.length > 0) {
    const sig = signals[0];
    console.log("6️⃣ Latest Trade Signal:\n");
    console.log(`   Direction: ${sig.direction.toUpperCase()}`);
    console.log(`   Confidence: ${sig.confidence}%`);
    console.log(`   Leverage: ${sig.leverage}x`);
    console.log(`   Status: ${sig.status}`);
    console.log(`   Created: ${sig.created_at}\n`);
  } else {
    console.log("6️⃣ No trade signal created (decision was HOLD)\n");
  }

  console.log("✅ Pipeline test completed successfully!");
  process.exit(0);
}

testPipeline().catch(err => {
  console.error("💥 Test failed:", err);
  process.exit(1);
});
