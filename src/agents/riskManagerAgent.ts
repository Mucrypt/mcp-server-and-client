import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { supabase } from "../core/supabase";

export class RiskManagerAgent extends TradingAgent {
  accountId: string;

  constructor(accountId: string) {
    super("risk-manager", 3 * 60_000, "BTCUSDT", "1h");
    this.accountId = accountId;
  }

  async run(): Promise<AgentRunResult | void> {
    const { data: account, error } = await supabase
      .from("trading_accounts")
      .select("*")
      .eq("id", this.accountId)
      .maybeSingle();

    if (error || !account) {
      console.warn("RiskManager: missing account or error", error?.message);
      return;
    }

    const balance = Number(account.current_balance ?? account.starting_balance);
    const starting = Number(account.starting_balance ?? 1);
    const dd = (balance - starting) / starting; // drawdown

    let score = 0;
    if (dd < -0.1) score = -0.8;        // stop trading
    else if (dd < -0.05) score = -0.4;  // reduce risk
    else if (dd > 0.1) score = 0.2;     // can risk slightly more

    const confidence = 90;

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence,
      payload: { balance, starting, drawdown: dd },
    };
  }
}
