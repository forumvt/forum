import { AVATAR_DAILY_LIMIT } from "@/lib/rate-limit-config";
import { withRedis } from "@/lib/redis";

function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function secondsUntilNextUtcDay(date = new Date()): number {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  );
  return Math.max(60, Math.ceil((next.getTime() - date.getTime()) / 1000));
}

function nextUtcMidnight(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  );
}

export type AvatarLimitStatus = {
  limit: number;
  usedChanges: number;
  remainingChanges: number;
  resetsAt: string;
};

export type AvatarLimitResult =
  | { ok: true; status: AvatarLimitStatus }
  | { ok: false; status: AvatarLimitStatus; error: "avatar_limit" };

function buildStatus(usedChanges: number): AvatarLimitStatus {
  const remainingChanges = Math.max(0, AVATAR_DAILY_LIMIT - usedChanges);
  return {
    limit: AVATAR_DAILY_LIMIT,
    usedChanges,
    remainingChanges,
    resetsAt: nextUtcMidnight().toISOString(),
  };
}

export async function getAvatarLimitStatus(
  userId: string,
): Promise<AvatarLimitStatus> {
  return withRedis(buildStatus(0), async (redis) => {
    const key = `avatar:changes:${userId}:${utcDateKey()}`;
    const usedChanges = Number(await redis.get(key)) || 0;
    return buildStatus(usedChanges);
  });
}

export async function assertAvatarChangeAllowed(
  userId: string,
): Promise<AvatarLimitResult> {
  const status = await getAvatarLimitStatus(userId);
  if (status.remainingChanges <= 0) {
    return { ok: false, status, error: "avatar_limit" };
  }
  return { ok: true, status };
}

export async function recordAvatarChange(userId: string): Promise<void> {
  await withRedis(undefined, async (redis) => {
    const key = `avatar:changes:${userId}:${utcDateKey()}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, secondsUntilNextUtcDay());
    }
  });
}
