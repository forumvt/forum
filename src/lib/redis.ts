import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;
let redisDisabled = false;

export function getRedis(): Redis | null {
  if (redisDisabled) return null;
  if (client !== undefined) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    client = null;
    return null;
  }

  client = new Redis({ url, token });
  return client;
}

function markRedisUnavailable(error: unknown): void {
  if (redisDisabled) return;
  redisDisabled = true;
  console.warn(
    "[redis] indisponível — limites e presença desativados até reiniciar:",
    error instanceof Error ? error.message : error,
  );
}

/** Executa operação Redis; em falha de rede, usa fallback (fail-open). */
export async function withRedis<T>(
  fallback: T,
  fn: (redis: Redis) => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fallback;

  try {
    return await fn(redis);
  } catch (error) {
    markRedisUnavailable(error);
    return fallback;
  }
}
