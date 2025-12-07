import { redis } from "../core/redis";

const QUEUE_KEY = "exec:queue";

/**
 * Enqueue a trade_signal ID for execution.
 */
export async function enqueueExecution(signalId: string) {
  // Use RPUSH so BRPOP pops oldest first (FIFO queue)
  await redis.rpush(QUEUE_KEY, signalId);
}

/**
 * Blocking dequeue: wait for a signal ID from the queue.
 * timeoutSeconds = 5 by default.
 */
export async function dequeueExecution(
  timeoutSeconds = 5
): Promise<string | null> {
  const res = await redis.brpop(QUEUE_KEY, timeoutSeconds);
  if (!res) return null;
  const [, value] = res; // [key, value]
  return value;
}
