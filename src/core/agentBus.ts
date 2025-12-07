import { supabase } from "./supabase";
import { AgentRunResult } from "./agentBase";

export async function recordAgentSignal(
  accountId: string,
  result: AgentRunResult
) {
  const { agent, symbol, timeframe, score, confidence, payload } = result;

  const { error } = await supabase.from("agent_signals").insert([
    {
      account_id: accountId,
      symbol,
      timeframe,
      agent_name: agent,
      score,
      confidence,
      payload,
    },
  ]);

  if (error) {
    console.error(`Failed to insert agent_signals for ${agent}:`, error.message);
  }
}
