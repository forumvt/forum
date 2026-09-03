import type { AbuseBlockResult } from "@/lib/rate-limit";
import { COOLDOWN_SECONDS } from "@/lib/rate-limit-config";
import { withRedis } from "@/lib/redis";

export type FloodAction = keyof typeof COOLDOWN_SECONDS;

export async function assertCooldown(
  action: FloodAction,
  userId: string,
): Promise<AbuseBlockResult> {
  return withRedis({ ok: true } as AbuseBlockResult, async (redis) => {
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
  });
}

export async function releaseCooldown(
  action: FloodAction,
  userId: string,
): Promise<void> {
  await withRedis(undefined, async (redis) => {
    await redis.del(`flood:${action}:${userId}`);
  });
}
