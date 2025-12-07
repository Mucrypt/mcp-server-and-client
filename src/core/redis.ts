import "dotenv/config";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn("⚠️ Redis unavailable - running without cache");
      return null; // Stop retrying
    }
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true, // Don't connect immediately
});

// Suppress error events
redis.on('error', (err) => {
  // Silently ignore connection errors
});

// Simple helper for locks
export async function acquireLock(
  key: string,
  ttlMs: number
): Promise<boolean> {
  try {
    const res = await redis.set(key, "locked", "PX", ttlMs, "NX");
    return res === "OK";
  } catch (err) {
    console.warn(`⚠️ Redis lock unavailable for ${key}`);
    return true; // Allow operation to proceed without lock
  }
}

export async function releaseLock(key: string) {
  try {
    await redis.del(key);
  } catch (err) {
    // Silently ignore
  }
}
