import "dotenv/config";
import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { supabase } from "./core/supabase";
import { syncAgentRegistry } from "./core/agentRegistry";
import { recordAgentSignal } from "./core/agentBus";
import { AgentRunResult } from "./core/agentBase";

// Agents
import { MarketStructureAgent } from "./agents/marketStructureAgent";
import { OrderFlowAgent } from "./agents/orderFlowAgent";
import { MomentumAgent } from "./agents/momentumAgent";
import { VolatilityRegimeAgent } from "./agents/volatilityRegimeAgent";
import { NewsSentimentAgent } from "./agents/newsSentimentAgent";
import { MultiTimeframeAgent } from "./agents/multiTimeframeAgent";
import { PatternRecognitionAgent } from "./agents/patternRecognitionAgent";
import { StatisticalEdgeAgent } from "./agents/statisticalEdgeAgent";
import { RiskManagerAgent } from "./agents/riskManagerAgent";
import { DecisionAgent } from "./agents/decisionAgent";
import { ExecutionAgent } from "./execution/executionAgent";
import { startHttpServer } from "./api/httpServer";

// Pipeline mode imports
import { runPipelineOnce } from "./pipeline/pipeline_orchestrator.js";


const server = new McpServer({
  name: "ai-trading-mcp",
  version: "1.0.0",
});

// 🔧 For now use a fixed account id (create one manually in Supabase or via tool)
const TEST_ACCOUNT_ID = process.env.TEST_ACCOUNT_ID ?? "00000000-0000-0000-0000-000000000001";

// === MCP TOOLS ===

server.tool(
  "create-user",
  "Create a user in Supabase",
  {
    name: z.string(),
    email: z.string().email(),
  },
  {},
  async ({ name, email }) => {
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email }])
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating user: ${error?.message ?? "unknown"}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `User created with id: ${data.id}`,
        },
      ],
    };
  }
);

server.tool(
  "create-trading-account",
  "Create a trading account",
  {
    userId: z.number(),
    name: z.string(),
    startingBalance: z.number().positive(),
    maxLeverage: z.number().positive(),
    maxRiskPerTrade: z.number().min(0).max(100),
  },
  {},
  async params => {
    const { userId, name, startingBalance, maxLeverage, maxRiskPerTrade } =
      params;

    const { data, error } = await supabase
      .from("trading_accounts")
      .insert([
        {
          user_id: userId,
          name,
          starting_balance: startingBalance,
          current_balance: startingBalance,
          max_leverage: maxLeverage,
          max_risk_per_trade: maxRiskPerTrade,
        },
      ])
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create trading account: ${
              error?.message ?? "Unknown"
            }`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Trading account created with id: ${data.id}`,
        },
      ],
    };
  }
);

server.tool(
  "list-trade-signals",
  "List latest trade signals for an account",
  {
    accountId: z.string(),
  },
  {},
  async ({ accountId }) => {
    const { data, error } = await supabase
      .from("trade_signals")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing trade_signals: ${error.message}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data ?? [], null, 2),
        },
      ],
    };
  }
);

server.tool(
  "run-pipeline",
  "Trigger a sequential pipeline run for one account + symbol + timeframe",
  {
    accountId: z.string(),
    symbol: z.string().default("BTCUSDT"),
    timeframe: z.string().default("1h"),
  },
  {},
  async ({ accountId, symbol, timeframe }) => {
    const runId = await runPipelineOnce(accountId, symbol, timeframe);

    if (!runId) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to start pipeline run",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Pipeline run started with id: ${runId}`,
        },
      ],
    };
  }
);

// === START AGENTS ===

async function startAgents() {
  const agents = [
    new MarketStructureAgent(),
    new OrderFlowAgent(),
    new MomentumAgent(),
    new VolatilityRegimeAgent(),
    new NewsSentimentAgent(),
    new MultiTimeframeAgent(),
    new PatternRecognitionAgent(),
    new StatisticalEdgeAgent(),
    new RiskManagerAgent(TEST_ACCOUNT_ID),
    new DecisionAgent(TEST_ACCOUNT_ID),
  ];

  for (const agent of agents) {
    const originalRun = agent.run.bind(agent);

    if (!agent.name.includes("decision")) {
      agent.run = async (): Promise<AgentRunResult | void> => {
        const result = await originalRun();
        if (result) {
          await recordAgentSignal(TEST_ACCOUNT_ID, result);
        }
        return result;
      };
    }

    agent.start();
  }

  // Start ExecutionAgent (separate loop, reading from Redis queue)
  const venue = (process.env.EXEC_VENUE as any) || "bybit"; // "bybit" | "binance-futures"
  const execAgent = new ExecutionAgent(venue);
  execAgent.start();
}


async function main() {
  await syncAgentRegistry();
  
  // Start HTTP server
  await startHttpServer(4000);

  // Start ExecutionAgent (always runs)
  const venue = (process.env.EXEC_VENUE as any) || "bybit";
  const execAgent = new ExecutionAgent(venue);
  execAgent.start();

  // Choose mode: interval-based agents OR pipeline mode
  const mode = process.env.AGENT_MODE ?? "interval"; // "interval" | "pipeline"

  if (mode === "pipeline") {
    console.log("🔄 Running in PIPELINE mode");
    console.log("   Use POST /pipeline/run to trigger runs");
    console.log("   Or start the scheduler separately: node dist/pipeline/scheduler.js");
  } else {
    console.log("🔄 Running in INTERVAL mode (legacy)");
    await startAgents();
  }

  // Only start MCP server if enabled (e.g., for local dev, not in Docker)
  if (process.env.MCP_SERVER_ENABLED === "true") {
    console.log("MCP server enabled, starting...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server connected via stdio.");
  } else {
    console.log("MCP server disabled. Running agents and HTTP API only.");
  }
}

main().catch(err => {
  console.error("Fatal error", err);
  process.exit(1);
});
