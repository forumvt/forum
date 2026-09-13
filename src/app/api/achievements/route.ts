import { NextResponse } from "next/server";

import * as achievementService from "@/services/achievement.service";

export async function GET() {
  const achievements = await achievementService.listCatalog();
  return NextResponse.json({
    achievements: achievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      event: a.event,
      target: a.target,
      rewardXp: a.rewardXp,
      kind: a.kind,
      gameSlug: a.gameSlug,
    })),
  });
}
