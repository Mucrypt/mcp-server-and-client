import express from "express";
import cors from "cors";
import { supabase } from "../core/supabase";
import { runPipelineOnce } from "../pipeline/pipeline_orchestrator.js";
import chatRoutes from "./chatRoutes";
import brainRoutes from "./brainRoutes";

export async function startHttpServer(port = 3000) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount chat routes
  app.use("/api/chat", chatRoutes);
  
  // Mount brain/AI routes
  app.use("/api/brain", brainRoutes);

  // Simple healthcheck
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "AI trading engine running" });
  });

  // List agents + last activity
  app.get("/agents/status", async (_req, res) => {
    const { data: agents, error: agentsErr } = await supabase
      .from("agents")
      .select("*")
      .order("priority", { ascending: false });

    if (agentsErr) {
      return res.status(500).json({
        error: "Failed to fetch agents",
        details: agentsErr.message,
      });
    }

    const { data: signals, error: sigErr } = await supabase
      .from("agent_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (sigErr) {
      return res.status(500).json({
        error: "Failed to fetch agent_signals",
        details: sigErr.message,
      });
    }

    const latestByAgent: Record<
      string,
      { created_at: string; score: number; confidence: number }
    > = {};

    for (const row of signals ?? []) {
      if (!latestByAgent[row.agent_name]) {
        latestByAgent[row.agent_name] = {
          created_at: row.created_at,
          score: Number(row.score ?? 0),
          confidence: Number(row.confidence ?? 0),
        };
      }
    }

    const result = (agents ?? []).map(a => ({
      name: a.name,
      role: a.role,
      group: a.group_name,
      priority: a.priority,
      enabled: a.enabled,
      meta: a.meta,
      last_signal: latestByAgent[a.name] ?? null,
    }));

    res.json(result);
  });

  // Get trading account info
  app.get("/accounts/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("trading_accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch account",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(data);
  });

  // Last N trade_signals for account
  app.get("/accounts/:id/trade-signals", async (req, res) => {
    const { id } = req.params;
    const limit = Number(req.query.limit ?? 20);

    const { data, error } = await supabase
      .from("trade_signals")
      .select("*")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch trade_signals",
        details: error.message,
      });
    }

    res.json(data ?? []);
  });

  // Last N raw agent_signals for account
  app.get("/accounts/:id/agent-signals", async (req, res) => {
    const { id } = req.params;
    const limit = Number(req.query.limit ?? 50);

    const { data, error } = await supabase
      .from("agent_signals")
      .select("*")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch agent_signals",
        details: error.message,
      });
    }

    res.json(data ?? []);
  });

  // Get all accounts
  app.get("/accounts", async (_req, res) => {
    const { data, error } = await supabase
      .from("trading_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch accounts",
        details: error.message,
      });
    }

    res.json(data ?? []);
  });

  // Get all trade signals (across all accounts)
  app.get("/trade-signals", async (req, res) => {
    const limit = Number(req.query.limit ?? 50);

    const { data, error } = await supabase
      .from("trade_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch trade_signals",
        details: error.message,
      });
    }

    res.json(data ?? []);
  });


  app.get("/pipeline/runs", async (req, res) => {
  const accountId = req.query.accountId as string | undefined;
  const limit = Number(req.query.limit ?? 20);

  const runsQuery = supabase
    .from("pipeline_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: runs, error: runErr } = accountId
    ? await runsQuery.eq("account_id", accountId)
    : await runsQuery;

  if (runErr) {
    return res.status(500).json({
      error: "Failed to fetch pipeline_runs",
      details: runErr.message,
    });
  }

  const runIds = (runs ?? []).map(r => r.id);
  if (!runIds.length) return res.json([]);

  const { data: steps, error: stepErr } = await supabase
    .from("pipeline_steps")
    .select("*")
    .in("run_id", runIds)
    .order("created_at", { ascending: true });

  if (stepErr) {
    return res.status(500).json({
      error: "Failed to fetch pipeline_steps",
      details: stepErr.message,
    });
  }

  const stepsByRun = (steps ?? []).reduce<Record<string, any[]>>(
    (acc, step) => {
      acc[step.run_id] = acc[step.run_id] ?? [];
      acc[step.run_id].push(step);
      return acc;
    },
    {}
  );

  const result = (runs ?? []).map(run => ({
    ...run,
    steps:
      stepsByRun[run.id] ?? [],
  }));

  res.json(result);
});

  // Trigger a pipeline run manually (POST)
  app.post("/pipeline/run", async (req, res) => {
    const { accountId, symbol, timeframe, useHttpAgents } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    const runId = await runPipelineOnce(
      accountId,
      symbol ?? "BTCUSDT",
      timeframe ?? "1h",
      useHttpAgents ?? (process.env.USE_HTTP_AGENTS === "true")
    );

    if (!runId) {
      return res.status(500).json({ error: "Pipeline run failed to start" });
    }

    res.json({ runId, status: "running", mode: useHttpAgents ? "microservices" : "monolithic" });
  });


  // Start server
  return new Promise<void>(resolve => {
    app.listen(port, () => {
      console.log(`🌐 HTTP API listening on http://localhost:${port}`);
      resolve();
    });
  });
}
