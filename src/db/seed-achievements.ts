import "dotenv/config";

import { db } from "@/db";
import { achievementTable } from "@/db/schema";
import { ACHIEVEMENTS_SEED } from "@/lib/games/achievements-catalog";

async function main() {
  for (const achievement of ACHIEVEMENTS_SEED) {
    await db
      .insert(achievementTable)
      .values({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        event: achievement.event,
        target: achievement.target,
        rewardXp: achievement.rewardXp,
        kind: achievement.kind,
        gameSlug: achievement.gameSlug,
      })
      .onConflictDoUpdate({
        target: achievementTable.id,
        set: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          event: achievement.event,
          target: achievement.target,
          rewardXp: achievement.rewardXp,
          kind: achievement.kind,
          gameSlug: achievement.gameSlug,
        },
      });
  }

  console.log(`Seeded ${ACHIEVEMENTS_SEED.length} achievements.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
