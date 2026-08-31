import { APIError } from "better-auth/api";

import { RATE_LIMITS } from "@/lib/rate-limit-config";
import { getRedis } from "@/lib/redis";

export type WriteAbuseError = "rate_limited" | "cooldown" | "duplicate_content";

export type AbuseBlockResult =
  | { ok: true }
  | { ok: false; error: WriteAbuseError; retryAfterSeconds?: number };

type RateLimitWindow =
  | `${number} s`
  | `${number} m`
  | `${number} h`
  | `${number} d`;

type RateLimitConfig = {
  requests: number;
  window: RateLimitWindow;
};

function windowToSeconds(window: RateLimitWindow): number {
  const [amountRaw, unit] = window.split(" ") as [string, string];
  const amount = Number(amountRaw);
  switch (unit) {
    case "s":
      return amount;
    case "m":
      return amount * 60;
    case "h":
      return amount * 60 * 60;
    case "d":
      return amount * 60 * 60 * 24;
    default:
      return amount;
  }
}

async function checkFixedWindowRateLimit(
  prefix: string,
  identifier: string,
  config: RateLimitConfig,
): Promise<AbuseBlockResult> {
  const redis = getRedis();
  if (!redis) return { ok: true };

  const windowSeconds = windowToSeconds(config.window);
  const key = `rl:${prefix}:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (count > config.requests) {
    const ttl = await redis.ttl(key);
    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }

  return { ok: true };
}

const limitConfigs = {
  postReply: RATE_LIMITS.postReply,
  threadCreate: RATE_LIMITS.threadCreate,
  pmSend: RATE_LIMITS.pmSend,
  likeToggle: RATE_LIMITS.likeToggle,
  reportCreate: RATE_LIMITS.reportCreate,
  signatureUpdate: RATE_LIMITS.signatureUpdate,
  presence: RATE_LIMITS.presence,
  authSignIn: RATE_LIMITS.authSignIn,
  authSignUp: RATE_LIMITS.authSignUp,
  authForgotPassword: RATE_LIMITS.authForgotPassword,
} as const;

export type RateLimitKind = keyof typeof limitConfigs;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function getClientIpFromHeaders(
  headers: Headers | { get(name: string): string | null },
): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string,
): Promise<AbuseBlockResult> {
  return checkFixedWindowRateLimit(kind, identifier, limitConfigs[kind]);
}

export async function assertAuthRateLimit(
  kind: Extract<RateLimitKind, "authSignIn" | "authSignUp" | "authForgotPassword">,
  ip: string,
): Promise<void> {
  const result = await checkRateLimit(kind, ip);
  if (!result.ok) {
    throw new APIError("TOO_MANY_REQUESTS", {
      message: "Muitas tentativas. Tente novamente em alguns minutos.",
    });
  }
}
