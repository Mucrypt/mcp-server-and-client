/**
 * Risk Manager Agent Service
 * 
 * Microservice version of RiskManagerAgent
 * Port: 5009
 */

import "dotenv/config";
import { AgentServiceBase, AgentServiceResult } from "./agent-service-base.js";
import { PipelineContext } from "../core/agentBase.js";
import { supabase } from "../core/supabase.js";

class RiskManagerService extends AgentServiceBase {
  constructor() {
    super("risk-manager", 5009);
  }

  protected async processContext(context: PipelineContext): Promise<AgentServiceResult> {
    const { accountId, account } = context;

    // Load account if not provided
    let acc = account;
    if (!acc) {
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("id", accountId)
        .maybeSingle();

      if (error || !data) {
        return { 
          score: -1, 
          confidence: 100, 
          payload: { error: "Account not found", riskLevel: "critical" } 
        };
      }
      acc = data;
    }

    const startingBalance = Number(acc.starting_balance ?? 0);
    const currentBalance = Number(acc.current_balance ?? 0);
    
    if (startingBalance === 0) {
      return { 
        score: -1, 
        confidence: 100, 
        payload: { error: "Invalid account balance", riskLevel: "critical" } 
      };
    }

    // Calculate drawdown
    const drawdown = ((startingBalance - currentBalance) / startingBalance) * 100;

    let score = 0;
    let riskLevel = "normal";

    if (drawdown > 20) {
      riskLevel = "critical";
      score = -1; // Full stop
    } else if (drawdown > 10) {
      riskLevel = "high";
      score = -0.6; // Reduce risk
    } else if (drawdown > 5) {
      riskLevel = "warning";
      score = -0.3;
    } else if (currentBalance > startingBalance) {
      riskLevel = "profit";
      score = 0.3; // Allow slightly more risk
    }

    return {
      score,
      confidence: 95,
      payload: {
        riskLevel,
        drawdown: drawdown.toFixed(2) + "%",
        currentBalance,
        startingBalance,
        maxLeverage: acc.max_leverage,
        maxRiskPerTrade: acc.max_risk_per_trade
      }
    };
  }
}

const service = new RiskManagerService();
service.start().catch(err => {
  console.error("Failed to start risk-manager service:", err);
  process.exit(1);
});
