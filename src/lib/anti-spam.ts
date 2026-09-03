import { createHash } from "crypto";

import type { AbuseBlockResult } from "@/lib/rate-limit";
import { DUPLICATE_CONTENT_TTL_SECONDS } from "@/lib/rate-limit-config";
import { withRedis } from "@/lib/redis";

function normalizeContent(content: string): string {
  return content.trim().replace(/\s+/g, " ").toLowerCase();
}

function contentHash(content: string): string {
  return createHash("sha256").update(normalizeContent(content)).digest("hex");
}

function contentKey(userId: string, content: string): string {
  return `spam:content:${userId}:${contentHash(content)}`;
}

export async function assertUniqueContent(
  userId: string,
  content: string,
): Promise<AbuseBlockResult> {
  return withRedis({ ok: true } as AbuseBlockResult, async (redis) => {
    const exists = await redis.get(contentKey(userId, content));
    if (exists) {
      return { ok: false, error: "duplicate_content" };
    }
    return { ok: true };
  });
}

export async function recordContentSent(
  userId: string,
  content: string,
): Promise<void> {
  await withRedis(undefined, async (redis) => {
    await redis.set(contentKey(userId, content), "1", {
      ex: DUPLICATE_CONTENT_TTL_SECONDS,
    });
  });
}
