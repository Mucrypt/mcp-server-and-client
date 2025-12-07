import { dequeueExecution } from "./executionQueue";
import { supabase } from "../core/supabase";
import { acquireLock, releaseLock } from "../core/redis";
import { placeOrder, Venue, OrderSide } from "./exchangeClient";

/**
 * ExecutionAgent:
 *  - Waits on Redis queue for trade_signal IDs
 *  - Uses locking per signal
 *  - Loads trade_signal + account
 *  - Sends order to selected venue (Bybit or Binance)
 *  - Updates status in Supabase
 */
export class ExecutionAgent {
  private running = false;
  private venue: Venue;

  constructor(venue: Venue = "bybit") {
    this.venue = venue;
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`🚀 ExecutionAgent started using venue=${this.venue}`);
    this.loop();
  }

  stop() {
    this.running = false;
    console.log("🛑 ExecutionAgent stopped.");
  }

  private async loop() {
    while (this.running) {
      try {
        const signalId = await dequeueExecution(5);

        if (!signalId) {
          // nothing in queue, loop again
          continue;
        }

        const lockKey = `lock:signal:${signalId}`;
        const gotLock = await acquireLock(lockKey, 60_000); // 60 sec

        if (!gotLock) {
          console.log(
            `ExecutionAgent: signal ${signalId} already being processed, skipping`
          );
          continue;
        }

        try {
          await this.processSignal(signalId);
        } finally {
          await releaseLock(lockKey);
        }
      } catch (err) {
        console.error("ExecutionAgent loop error:", err);
      }
    }
  }

  private async processSignal(signalId: string) {
    // 1) Load trade_signal
    const { data: signal, error } = await supabase
      .from("trade_signals")
      .select("*")
      .eq("id", signalId)
      .maybeSingle();

    if (error || !signal) {
      console.error("ExecutionAgent: cannot load trade_signal", error?.message);
      return;
    }

    if (signal.status !== "pending") {
      console.log(`ExecutionAgent: signal ${signalId} already ${signal.status}`);
      return;
    }

    // 2) Load trading account
    const { data: account, error: accErr } = await supabase
      .from("trading_accounts")
      .select("*")
      .eq("id", signal.account_id)
      .maybeSingle();

    if (accErr || !account) {
      console.error("ExecutionAgent: missing account for signal", accErr?.message);
      await this.updateSignalStatus(signalId, "rejected", "Missing account");
      return;
    }

    // For demo: fixed position sizing (this could use riskManager)
    const leverage = Number(signal.leverage ?? 1);
    const balance = Number(account.current_balance ?? account.starting_balance);
    const notional = balance * 0.01 * leverage; // risk ~1% * leverage

    // TEMP: approximate quantity for BTCUSDT assuming price ~ 50k
    // In reality you would query last price and compute quantity precisely.
    const approxPrice = 50_000;
    const qty = notional / approxPrice;

    if (qty <= 0) {
      await this.updateSignalStatus(signalId, "rejected", "Quantity <= 0");
      return;
    }

    const side: OrderSide =
      signal.direction === "buy" ? "buy" : signal.direction === "sell" ? "sell" : "buy";

    console.log(
      `ExecutionAgent: executing ${signal.direction.toUpperCase()} ${signal.symbol} qty=${qty}`
    );

    // 3) Place order via exchange client
    const res = await placeOrder({
      venue: this.venue,
      symbol: signal.symbol,
      side,
      quantity: qty,
      leverage,
    });

    if (!res.success) {
      console.error("ExecutionAgent: order failed:", res.error);
      await this.updateSignalStatus(
        signalId,
        "rejected",
        `Order failed: ${res.error}`
      );
      return;
    }

    // 4) Update trade_signals status to executed
    await this.updateSignalStatus(signalId, "executed", undefined, res.txId);
    console.log(
      `✅ ExecutionAgent: signal ${signalId} executed, txId=${res.txId}`
    );
  }

  private async updateSignalStatus(
    signalId: string,
    status: "pending" | "executed" | "rejected",
    reason?: string,
    txId?: string
  ) {
    const update: any = { status };
    if (reason) {
      update.payload = { reason }; // ensure you have a JSONB column if you want this (optional)
    }
    if (txId) {
      update.exchange_tx_id = txId; // optional extra column if you add it
    }

    const { error } = await supabase
      .from("trade_signals")
      .update(update)
      .eq("id", signalId);

    if (error) {
      console.error("ExecutionAgent: failed to update trade_signal", error.message);
    }
  }
}
