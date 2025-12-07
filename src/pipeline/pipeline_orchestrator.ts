/**
 * Mukulah AI – Sequential Trading Pipeline (Microservices Architecture Spec)
 * ========================================================================
 *
 * GOAL
 * ----
 * This file defines the core ALGORITHM + INTERFACES for the Mukulah AI
 * trading pipeline. It is meant to be:
 *
 *   - a clear blueprint for GitHub Copilot / other AIs
 *   - a reference for implementing all agents as microservices
 *   - easy to extend as the system grows
 *
 * CORE IDEAS
 * ----------
 * 1. One "pipeline run" = one full decision process for:
 *      - one trading account
 *      - one symbol (e.g. BTCUSDT)
 *      - one timeframe (e.g. 1h)
 *
 * 2. Agents DO NOT run randomly or all at once.
 *    They run sequentially in a fixed ORDER like a pipeline:
 *
 *    [MarketStructure] ➜ [OrderFlow] ➜ [Momentum] ➜ [VolatilityRegime]
 *         ➜ [NewsSentiment] ➜ [MultiTimeframe] ➜ [PatternRecognition]
 *         ➜ [StatisticalEdge] ➜ [RiskManager] ➜ [Decision + Execution]
 *
 * 3. Each agent:
 *      - Receives the shared PipelineContext
 *      - Can read results from previous agents in context.agentResults
 *      - Returns (score, confidence, payload)
 *
 * 4. DecisionAgent:
 *      - Reads all agentResults
 *      - Fuses them into:
 *          - direction: "buy" | "sell" | "hold"
 *          - confidence: 0–100
 *          - leverage: number
 *      - Creates a trade_signal row (status = "pending")
 *      - Enqueues the signal id into Redis execution queue
 *
 * 5. ExecutionAgent:
 *      - Runs in its own loop (microservice / container)
 *      - Dequeues signal ids from Redis
 *      - Uses RiskManager + account data to decide if the trade is allowed
 *      - If allowed => place order on Bybit/Binance testnet
 *      - Updates trade_signal status to "executed" or "rejected"
 *
 * 6. Everything is logged to Supabase:
 *      - pipeline_runs (one row per pipeline run)
 *      - pipeline_steps (one row per agent step in that run)
 *      - agent_signals (optional – raw agent outputs)
 *      - trade_signals (final trade decision)
 *
 * SAFETY / REALITY CHECK
 * ----------------------
 * No algorithm can guarantee profit or "free money".
 * This design focuses on:
 *    - stacking multiple edges
 *    - strong risk control
 *    - observability (so you can measure + improve)
 *
 * HOW TO USE THIS FILE
 * --------------------
 * - Place it in: src/pipeline/pipeline_orchestrator.ts
 * - Implement the TODOs with help from Copilot.
 * - Make sure Supabase, Redis, and each Agent class exist.
 * - Later, split each part into separate microservices:
 *      - pipeline-orchestrator service
 *      - agents services
 *      - execution service
 *      - http-api service
 */

// ---------------------------------------------------------------------------
// IMPORTS (adjust imports to match your actual project structure)
// ---------------------------------------------------------------------------

import { supabase } from "../core/supabase.js";
import { enqueueExecution } from "../execution/executionQueue.js";
import { Candle, getOHLC } from "../core/dataFeed.js";

// Agent classes (you already have them in your project)
// Adjust import paths if needed.
import { MarketStructureAgent } from "../agents/marketStructureAgent.js";
import { OrderFlowAgent } from "../agents/orderFlowAgent.js";
import { MomentumAgent } from "../agents/momentumAgent.js";
import { VolatilityRegimeAgent } from "../agents/volatilityRegimeAgent.js";
import { NewsSentimentAgent } from "../agents/newsSentimentAgent.js";
import { MultiTimeframeAgent } from "../agents/multiTimeframeAgent.js";
import { PatternRecognitionAgent } from "../agents/patternRecognitionAgent.js";
import { StatisticalEdgeAgent } from "../agents/statisticalEdgeAgent.js";
import { RiskManagerAgent } from "../agents/riskManagerAgent.js";

// Professional Decision Agent (uses advanced reasoning)
import { ProfessionalDecisionAgent, DecisionResult as ProfessionalDecisionResult } from "../agents/professionalDecisionAgent.js";

// HTTP Agent Client (for microservices mode)
import { HttpAgentClient, getDefaultAgentServices } from "./http-agent-client.js";

// ---------------------------------------------------------------------------
// SHARED TYPES
// ---------------------------------------------------------------------------

/**
 * Result returned by a single agent during a pipeline run.
 */
export type AgentResult = {
  score: number;        // -1 .. 1  (negative: sell bias, positive: buy bias)
  confidence: number;   // 0 .. 100 (%)
  payload?: any;        // extra info (trend, regime, pattern details, etc.)
};

/**
 * Shared context object passed to all agents in the pipeline.
 * Agents can read/write to this, so they "know" each other's results.
 */
export type PipelineContext = {
  accountId: string;
  symbol: string;        // e.g. "BTCUSDT"
  timeframe: string;     // e.g. "1h"
  account?: any;         // trading_accounts row from Supabase

  /**
   * Optionally prefetch market data (so all agents reuse the same data).
   */
  marketData?: {
    ohlc_1m?: Candle[];
    ohlc_5m?: Candle[];
    ohlc_15m?: Candle[];
    ohlc_1h?: Candle[];
    ohlc_4h?: Candle[];
    ohlc_1d?: Candle[];
  };

  /**
   * Agent results, keyed by agent name:
   * - "market-structure"
   * - "order-flow"
   * - "momentum"
   * - ...
   */
  agentResults: Record<string, AgentResult>;
};

/**
 * DecisionAgent output – final fused decision.
 */
export type DecisionResult = {
  finalScore: number;              // -1..1
  direction: "buy" | "sell" | "hold";
  confidence: number;             // 0..100
  leverage: number;               // risk-adjusted leverage
};

// ---------------------------------------------------------------------------
// PIPELINE ORDER – this defines the chain of agents
// ---------------------------------------------------------------------------

/**
 * Fixed order in which agents are executed in a pipeline run.
 * Each agent can read previous results from context.agentResults.
 */
export const pipelineOrder = [
  "market-structure",
  "order-flow",
  "momentum",
  "volatility-regime",
  "news-sentiment",
  "multi-timeframe",
  "pattern-recognition",
  "statistical-edge",
  "risk-manager",
] as const;

export type PipelineAgentName = (typeof pipelineOrder)[number];

// ---------------------------------------------------------------------------
// UTILITY: build initial PipelineContext
// ---------------------------------------------------------------------------

/**
 * Build the initial PipelineContext for a run.
 * - Loads trading account
 * - Optionally prefetches OHLC data (so all agents reuse it)
 */
export async function buildInitialContext(
  accountId: string,
  symbol: string,
  timeframe: string
): Promise<PipelineContext | null> {
  // 1) Load account
  const { data: account, error: accErr } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();

  if (accErr || !account) {
    console.error(
      "buildInitialContext: failed to load account",
      accErr?.message
    );
    return null;
  }

  // 2) Prefetch some OHLC (optional but good for microservices)
  //    Agents can reuse this, instead of each hitting Binance separately.
  const [ohlc_15m, ohlc_1h, ohlc_4h, ohlc_1d] = await Promise.all([
    getOHLC(symbol, "15m", 200).catch(() => []),
    getOHLC(symbol, "1h", 200).catch(() => []),
    getOHLC(symbol, "4h", 200).catch(() => []),
    getOHLC(symbol, "1d", 200).catch(() => []),
  ]);

  const context: PipelineContext = {
    accountId,
    symbol,
    timeframe,
    account,
    marketData: {
      ohlc_15m,
      ohlc_1h,
      ohlc_4h,
      ohlc_1d,
    },
    agentResults: {},
  };

  return context;
}

// ---------------------------------------------------------------------------
// RUN ONE PIPELINE STEP (ONE AGENT) AND RECORD IT
// ---------------------------------------------------------------------------

/**
 * Helper interface for agents in the pipeline.
 * We want each agent to implement:
 *
 *    async run(context: PipelineContext): Promise<AgentResult>
 */
export interface PipelineAgent {
  run(ctx: PipelineContext): Promise<AgentResult>;
}

/**
 * Adapter to wrap existing TradingAgent instances for pipeline use.
 * Existing agents return AgentRunResult, we need to adapt to AgentResult.
 */
function adaptAgentForPipeline(agent: any): PipelineAgent {
  return {
    async run(ctx: PipelineContext): Promise<AgentResult> {
      // If agent has runInPipeline method, use it
      if (typeof agent.runInPipeline === 'function') {
        return await agent.runInPipeline(ctx);
      }
      
      // Otherwise, call the regular run() and adapt the result
      const result = await agent.run();
      
      if (!result) {
        return { score: 0, confidence: 0 };
      }
      
      return {
        score: result.score,
        confidence: result.confidence,
        payload: result.payload,
      };
    },
  };
}

/**
 * Run one agent in the pipeline, update context.agentResults,
 * and insert pipeline_steps row in Supabase.
 */
export async function runStep(
  runId: string,
  agentName: PipelineAgentName,
  agentInstance: PipelineAgent,
  context: PipelineContext
): Promise<void> {
  const startedAt = new Date().toISOString();
  let result: AgentResult | null = null;
  let errorMessage: string | null = null;

  try {
    result = await agentInstance.run(context);
    // Save result into shared context so next agents can use it
    if (result) {
      context.agentResults[agentName] = result;
    }
  } catch (err: any) {
    console.error(`runStep error for agent ${agentName}:`, err);
    errorMessage = err?.message ?? String(err);
  }

  const finishedAt = new Date().toISOString();

  // Insert into pipeline_steps table
  const { error } = await supabase.from("pipeline_steps").insert([
    {
      run_id: runId,
      agent_name: agentName,
      started_at: startedAt,
      finished_at: finishedAt,
      score: result?.score ?? 0,
      confidence: result?.confidence ?? 0,
      payload: result
        ? { ...(result.payload ?? {}), error: errorMessage }
        : { error: errorMessage },
    },
  ]);

  if (error) {
    console.error("runStep: failed to insert pipeline_steps:", error.message);
  }
}

// ---------------------------------------------------------------------------
// DECISION FUSION – combine all agent results into one decision
// ---------------------------------------------------------------------------

/**
 * Fuse all agent results from context.agentResults into a single
 * trade decision (direction, confidence, leverage).
 *
 * This is the "brain" of the DecisionAgent.
 */
export function fuseDecision(context: PipelineContext): DecisionResult {
  const results = context.agentResults;

  const mkt = results["market-structure"] ?? { score: 0, confidence: 0 };
  const flow = results["order-flow"] ?? { score: 0, confidence: 0 };
  const mom = results["momentum"] ?? { score: 0, confidence: 0 };
  const vol = results["volatility-regime"] ?? { score: 0, confidence: 0 };
  const sent = results["news-sentiment"] ?? { score: 0, confidence: 0 };
  const mtf = results["multi-timeframe"] ?? { score: 0, confidence: 0 };
  const patt = results["pattern-recognition"] ?? { score: 0, confidence: 0 };
  const stat = results["statistical-edge"] ?? { score: 0, confidence: 0 };
  const risk = results["risk-manager"] ?? { score: 0, confidence: 0 };

  const weights: Record<string, number> = {
    "market-structure": 1.5,
    "order-flow": 1.2,
    "momentum": 1.2,
    "volatility-regime": 0.8,
    "news-sentiment": 1.5,
    "multi-timeframe": 1.3,
    "pattern-recognition": 1.0,
    "statistical-edge": 1.3,
    "risk-manager": 2.0,
  };

  let weightedSum = 0;
  let weightTotal = 0;

  for (const [name, res] of Object.entries(results)) {
    const w = weights[name] ?? 1.0;
    const eff = w * (res.confidence / 100);
    weightedSum += res.score * eff;
    weightTotal += eff;
  }

  const finalScore = weightTotal === 0 ? 0 : weightedSum / weightTotal;

  let direction: "buy" | "sell" | "hold" = "hold";
  if (finalScore > 0.25) direction = "buy";
  else if (finalScore < -0.25) direction = "sell";

  const confidence = Math.min(99, Math.abs(finalScore) * 100);

  // Decide leverage based on volatility regime + risk-manager
  let leverage = 1;
  const volPayload = vol.payload ?? {};
  const regime = volPayload.regime ?? 2; // 1=calm, 2=normal, 3=high

  if (regime === 1) leverage = 3;
  if (regime === 2) leverage = 2;
  if (regime === 3) leverage = 1;

  // RiskManager adjustments
  if (risk.score < -0.5) {
    // deep drawdown => no trading
    direction = "hold";
  } else if (risk.score < 0) {
    // warning => reduce leverage
    leverage = Math.max(1, leverage - 1);
  }

  return {
    finalScore,
    direction,
    confidence,
    leverage,
  };
}

// ---------------------------------------------------------------------------
// MAIN ORCHESTRATOR: runPipelineOnce
// ---------------------------------------------------------------------------

/**
 * Run a full sequential pipeline for one account + symbol + timeframe.
 *
 * Steps:
 *  1. Build initial context (account + market data)
 *  2. Insert pipeline_runs row (status="running")
 *  3. Run each agent in pipelineOrder with runStep(...)
 *  4. Fuse decision from context.agentResults
 *  5. Create trade_signal row (status="pending") if direction != "hold"
 *  6. Enqueue trade_signal.id into Redis execution queue
 *  7. Update pipeline_runs.status to "completed" or "failed"
 *
 * Returns pipeline_run id or null.
 */
export async function runPipelineOnce(
  accountId: string,
  symbol: string = "BTCUSDT",
  timeframe: string = "1h",
  useHttpAgents: boolean = false // NEW: toggle for microservices mode
): Promise<string | null> {
  // 1) Build initial context
  const context = await buildInitialContext(accountId, symbol, timeframe);
  if (!context) {
    return null;
  }

  // 2) Create pipeline_runs row
  const { data: run, error: runErr } = await supabase
    .from("pipeline_runs")
    .insert([
      {
        account_id: accountId,
        symbol,
        timeframe,
        status: "running",
      },
    ])
    .select("*")
    .maybeSingle();

  if (runErr || !run) {
    console.error("runPipelineOnce: failed to create pipeline_run", runErr?.message);
    return null;
  }

  const runId = run.id as string;

  try {
    let agents: Record<PipelineAgentName, PipelineAgent>;

    if (useHttpAgents) {
      // MICROSERVICES MODE: Use HTTP clients
      console.log("🌐 Running pipeline with HTTP agent microservices");
      const serviceConfigs = getDefaultAgentServices();
      
      agents = {
        "market-structure": new HttpAgentClient(serviceConfigs["market-structure"]),
        "order-flow": new HttpAgentClient(serviceConfigs["order-flow"]),
        "momentum": new HttpAgentClient(serviceConfigs["momentum"]),
        "volatility-regime": new HttpAgentClient(serviceConfigs["volatility-regime"]),
        "news-sentiment": new HttpAgentClient(serviceConfigs["news-sentiment"]),
        "multi-timeframe": new HttpAgentClient(serviceConfigs["multi-timeframe"]),
        "pattern-recognition": new HttpAgentClient(serviceConfigs["pattern-recognition"]),
        "statistical-edge": new HttpAgentClient(serviceConfigs["statistical-edge"]),
        "risk-manager": new HttpAgentClient(serviceConfigs["risk-manager"]),
      } as any;

    } else {
      // MONOLITHIC MODE: Use local classes
      console.log("📦 Running pipeline with local agent instances");
      const agentInstances = {
        "market-structure": new MarketStructureAgent(),
        "order-flow": new OrderFlowAgent(),
        "momentum": new MomentumAgent(),
        "volatility-regime": new VolatilityRegimeAgent(),
        "news-sentiment": new NewsSentimentAgent(),
        "multi-timeframe": new MultiTimeframeAgent(),
        "pattern-recognition": new PatternRecognitionAgent(),
        "statistical-edge": new StatisticalEdgeAgent(),
        "risk-manager": new RiskManagerAgent(accountId),
      };

      // Wrap agents with adapter
      agents = {
        "market-structure": adaptAgentForPipeline(agentInstances["market-structure"]),
        "order-flow": adaptAgentForPipeline(agentInstances["order-flow"]),
        "momentum": adaptAgentForPipeline(agentInstances["momentum"]),
        "volatility-regime": adaptAgentForPipeline(agentInstances["volatility-regime"]),
        "news-sentiment": adaptAgentForPipeline(agentInstances["news-sentiment"]),
        "multi-timeframe": adaptAgentForPipeline(agentInstances["multi-timeframe"]),
        "pattern-recognition": adaptAgentForPipeline(agentInstances["pattern-recognition"]),
        "statistical-edge": adaptAgentForPipeline(agentInstances["statistical-edge"]),
        "risk-manager": adaptAgentForPipeline(agentInstances["risk-manager"]),
      };
    }

    // 4) Run all agents sequentially
    for (const name of pipelineOrder) {
      const agent = agents[name];
      if (!agent) {
        console.warn(`runPipelineOnce: no agent instance for ${name}`);
        continue;
      }
      await runStep(runId, name, agent, context);
    }

    // 5) 🧠 PROFESSIONAL DECISION AGENT (replaces simple fuseDecision)
    console.log(`\n🧠 Running Professional Decision Agent...`);
    const professionalDecisionAgent = new ProfessionalDecisionAgent(accountId);
    const decision = await professionalDecisionAgent.run(context);
    
    console.log(`\n📊 PIPELINE DECISION:`);
    console.log(`   Direction: ${decision.direction.toUpperCase()}`);
    console.log(`   Confidence: ${decision.confidence}%`);
    console.log(`   Leverage: ${decision.leverage}x`);
    console.log(`   Final Score: ${decision.finalScore.toFixed(2)}`);

    // 6) Note: Trade signal creation is now handled inside ProfessionalDecisionAgent
    // It creates the signal with full professional reasoning and enqueues it
    // We just need to update the pipeline run status
    
    if (decision.direction !== "hold") {
      console.log(`\n✅ Trade signal created and enqueued by Professional Decision Agent`);
    } else {
      console.log(`\n⏸️  No trade - waiting for better setup`);
    }

    // 7) Mark run as completed
    await supabase
      .from("pipeline_runs")
      .update({ status: "completed" })
      .eq("id", runId);

    return runId;
  } catch (err: any) {
    console.error("runPipelineOnce: fatal error", err?.message ?? err);
    await supabase
      .from("pipeline_runs")
      .update({ status: "failed" })
      .eq("id", runId);
    return runId;
  }
}

// ---------------------------------------------------------------------------
// MICROservices ARCHITECTURE NOTES (IMPORTANT FOR FUTURE SPLIT)
// ---------------------------------------------------------------------------

/**
 * HOW TO TURN THIS INTO REAL MICROSERVICES
 * =======================================
 *
 * 1) Pipeline Orchestrator Service
 *    -----------------------------
 *    - Contains runPipelineOnce(...) from this file.
 *    - Exposes an HTTP endpoint, e.g.:
 *        POST /pipeline/run
 *          body: { accountId, symbol, timeframe }
 *        -> triggers runPipelineOnce and returns runId.
 *    - Could be triggered by a scheduler (cron) every 1h candle close.
 *
 * 2) Agents Services
 *    ---------------
 *    Option A (simple): keep using local classes as above.
 *
 *    Option B (true microservices):
 *      - Each agent is its own service/container exposing:
 *          POST /agent/:name/run
 *             body: { contextSubset }
 *             returns: AgentResult
 *      - The orchestrator calls these HTTP endpoints instead of
 *        new Agent().run(context).
 *      - All services share Supabase + Redis, so they see the same data.
 *
 * 3) Execution Service
 *    -----------------
 *    - Runs the ExecutionAgent loop on its own:
 *        while(true):
 *          id = dequeueExecution()
 *          process trade_signal
 *    - Uses Supabase + Bybit/Binance client.
 *    - Uses Redis lock "lock:signal:<id>" so only one execution worker
 *      can process a given signal.
 *
 * 4) HTTP API / Admin Service
 *    ------------------------
 *    - Exposes read-only endpoints:
 *        GET /health
 *        GET /agents/status
 *        GET /accounts/:id
 *        GET /accounts/:id/trade-signals
 *        GET /pipeline/runs
 *    - Your Next.js admin dashboard calls this API.
 *
 * KEY POINT: Even when split into multiple services, the ALGORITHM here
 * (sequential agents, shared context, fused decision, risk gating, execution)
 * stays the same. Only the transport changes (local calls -> HTTP/RPC).
 */
