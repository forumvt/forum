import { NextResponse } from "next/server";

import { withRedis } from "@/lib/redis";

export async function GET() {
  return withRedis(
    NextResponse.json({ logged: 0, guests: 0, total: 0 }),
    async (redis) => {
      const users = await redis.keys("online:user:*");
      const guests = await redis.keys("online:guest:*");

      return NextResponse.json({
        logged: users.length,
        guests: guests.length,
        total: users.length + guests.length,
      });
    },
  );
}
