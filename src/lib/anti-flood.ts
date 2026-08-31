import type { AbuseBlockResult } from "@/lib/rate-limit";
import { COOLDOWN_SECONDS } from "@/lib/rate-limit-config";
import { getRedis } from "@/lib/redis";

export type FloodAction = keyof typeof COOLDOWN_SECONDS;

export async function assertCooldown(
  action: FloodAction,
  userId: string,
): Promise<AbuseBlockResult> {
  const redis = getRedis();
  if (!redis) return { ok: true };

  const seconds = COOLDOWN_SECONDS[action];
  const key = `flood:${action}:${userId}`;
  const acquired = await redis.set(key, "1", { nx: true, ex: seconds });

  if (acquired === "OK") return { ok: true };

  const ttl = await redis.ttl(key);
  return {
    ok: false,
    error: "cooldown",
    retryAfterSeconds: ttl > 0 ? ttl : seconds,
  };
}

export async function releaseCooldown(
  action: FloodAction,
  userId: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`flood:${action}:${userId}`);
}
