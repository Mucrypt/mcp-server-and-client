export type AgentRunResult = {
  agent: string;
  symbol: string;
  timeframe: string;
  score: number;       // -1 to +1 (sell to buy)
  confidence: number;  // 0–100
  payload?: any;
};

// Import PipelineContext type for pipeline mode
export type PipelineContext = {
  accountId: string;
  symbol: string;
  timeframe: string;
  account?: any;
  marketData?: {
    ohlc_1m?: any[];
    ohlc_5m?: any[];
    ohlc_15m?: any[];
    ohlc_1h?: any[];
    ohlc_4h?: any[];
    ohlc_1d?: any[];
  };
  agentResults: Record<string, { score: number; confidence: number; payload?: any }>;
};

export abstract class TradingAgent {
  name: string;
  intervalMs: number;
  defaultSymbol: string;
  defaultTimeframe: string;
  private isRunning = false;

  constructor(
    name: string,
    intervalMs: number,
    symbol = "BTCUSDT",
    timeframe = "1h"
  ) {
    this.name = name;
    this.intervalMs = intervalMs;
    this.defaultSymbol = symbol;
    this.defaultTimeframe = timeframe;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`🔵 Agent ${this.name} started.`);
    this.loop();
  }

  stop() {
    this.isRunning = false;
    console.log(`🛑 Agent ${this.name} stopped.`);
  }

  private async loop() {
    while (this.isRunning) {
      try {
        const result = await this.run();
        if (result) {
          console.log(`✅ ${this.name} result:`, {
            score: result.score,
            confidence: result.confidence,
          });
        }
      } catch (err) {
        console.error(`❌ Error in ${this.name}:`, err);
      }

      await new Promise(res => setTimeout(res, this.intervalMs));
    }
  }

  // Main run method for interval-based mode
  abstract run(): Promise<AgentRunResult | void>;
  
  // Optional: implement this for pipeline mode
  // If not implemented, pipeline will call run() and adapt the result
  async runInPipeline?(ctx: PipelineContext): Promise<{ score: number; confidence: number; payload?: any }>;
}
