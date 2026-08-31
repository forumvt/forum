import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";

export async function POST() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });
  const cookieStore = await cookies();

  let guestId = cookieStore.get("guestId")?.value;
  const userId = session?.user?.id;
  const ttl = 300;

  const rateKey = userId ?? guestId ?? getClientIpFromHeaders(headerList);
  const rate = await checkRateLimit("presence", rateKey);
  if (!rate.ok) {
    return NextResponse.json(
      {
        error: "Muitas requisições de presença.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: true });
  }

  if (userId) {
    if (guestId) {
      await redis.del(`online:guest:${guestId}`);
      cookieStore.delete("guestId");
    }

    await redis.set(`online:user:${userId}`, 1, { ex: ttl });
    return NextResponse.json({ ok: true });
  }

  if (!guestId) {
    guestId = randomUUID();
    cookieStore.set("guestId", guestId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  await redis.set(`online:guest:${guestId}`, 1, { ex: ttl });

  return NextResponse.json({ ok: true });
}
