import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";
import * as gameEventService from "@/services/game-event.service";

export async function POST() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const result = await gameEventService.startDungeonRun(session.userId);
  if (!result.ok) {
    const status =
      result.error === "banned"
        ? 403
        : result.error === "rate_limited"
          ? 429
          : 400;
    return NextResponse.json(
      {
        error: result.error,
        reason: result.reason,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status },
    );
  }

  return NextResponse.json({ runId: result.runId });
}
