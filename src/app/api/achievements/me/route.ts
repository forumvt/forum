import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";
import * as achievementService from "@/services/achievement.service";
import * as xpService from "@/services/xp.service";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const [achievements, xpStats, unlockedCount] = await Promise.all([
    achievementService.listForUser(session.userId),
    xpService.getXpStats(session.userId),
    achievementService.countUnlocked(session.userId),
  ]);

  return NextResponse.json({
    achievements,
    unlockedCount,
    totalCount: achievements.length,
    xp: xpStats.totalXp,
    level: xpStats.level,
  });
}
