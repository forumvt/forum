import { NextResponse } from "next/server";
import { z } from "zod";

import { GAME_EVENT_TYPES } from "@/lib/games/xp-rewards";
import { requireSessionUser } from "@/lib/staff-guard";
import * as gameEventService from "@/services/game-event.service";

const eventSchema = z.object({
  runId: z.string().uuid(),
  type: z.enum(GAME_EVENT_TYPES),
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = eventSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await gameEventService.processDungeonEvent({
    userId: session.userId,
    runId: validation.data.runId,
    type: validation.data.type,
  });

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      banned: 403,
      not_found: 404,
      forbidden: 403,
      run_ended: 409,
      invalid_event: 400,
      rate_limited: 429,
      cooldown: 429,
      duplicate_content: 429,
      cap_reached: 400,
      unauthorized: 401,
    };
    return NextResponse.json(
      {
        error: result.error,
        reason: result.reason,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: statusMap[result.error] ?? 400 },
    );
  }

  return NextResponse.json({
    xpGained: result.xpGained,
    totalXp: result.totalXp,
    level: result.level,
    unlockedAchievements: result.unlockedAchievements,
  });
}
