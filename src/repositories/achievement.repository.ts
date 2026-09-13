import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  achievementTable,
  userAchievementTable,
  userTable,
} from "@/db/schema";

export interface AchievementRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  event: string | null;
  target: number;
  rewardXp: number;
  kind: "counter" | "state";
  gameSlug: string | null;
}

export interface UserAchievementRow {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  unlockedAt: Date | null;
}

export async function listAchievements(): Promise<AchievementRow[]> {
  return db.select().from(achievementTable).orderBy(asc(achievementTable.name));
}

export async function findAchievementById(
  id: string,
): Promise<AchievementRow | null> {
  const [row] = await db
    .select()
    .from(achievementTable)
    .where(eq(achievementTable.id, id))
    .limit(1);
  return row ?? null;
}

export async function findAchievementsByEvent(
  event: string,
): Promise<AchievementRow[]> {
  return db
    .select()
    .from(achievementTable)
    .where(eq(achievementTable.event, event));
}

export async function findUserAchievement(
  userId: string,
  achievementId: string,
): Promise<UserAchievementRow | null> {
  const [row] = await db
    .select()
    .from(userAchievementTable)
    .where(
      and(
        eq(userAchievementTable.userId, userId),
        eq(userAchievementTable.achievementId, achievementId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listUserAchievements(
  userId: string,
): Promise<UserAchievementRow[]> {
  return db
    .select()
    .from(userAchievementTable)
    .where(eq(userAchievementTable.userId, userId));
}

export async function countUnlocked(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userAchievementTable)
    .where(
      and(
        eq(userAchievementTable.userId, userId),
        isNotNull(userAchievementTable.unlockedAt),
      ),
    );
  return row?.count ?? 0;
}

export async function upsertProgress(params: {
  userId: string;
  achievementId: string;
  progress: number;
  unlockedAt?: Date | null;
}): Promise<UserAchievementRow> {
  const existing = await findUserAchievement(
    params.userId,
    params.achievementId,
  );

  if (!existing) {
    const [inserted] = await db
      .insert(userAchievementTable)
      .values({
        userId: params.userId,
        achievementId: params.achievementId,
        progress: params.progress,
        unlockedAt: params.unlockedAt ?? null,
      })
      .returning();
    return inserted;
  }

  const [updated] = await db
    .update(userAchievementTable)
    .set({
      progress: params.progress,
      unlockedAt:
        params.unlockedAt !== undefined
          ? params.unlockedAt
          : existing.unlockedAt,
    })
    .where(eq(userAchievementTable.id, existing.id))
    .returning();
  return updated;
}

export async function tryUnlock(params: {
  userId: string;
  achievementId: string;
  progress: number;
}): Promise<{ unlocked: boolean; row: UserAchievementRow }> {
  const existing = await findUserAchievement(
    params.userId,
    params.achievementId,
  );

  if (existing?.unlockedAt) {
    return {
      unlocked: false,
      row: await upsertProgress({
        userId: params.userId,
        achievementId: params.achievementId,
        progress: Math.max(existing.progress, params.progress),
      }),
    };
  }

  const unlockedAt = new Date();
  const row = await upsertProgress({
    userId: params.userId,
    achievementId: params.achievementId,
    progress: params.progress,
    unlockedAt,
  });

  return { unlocked: true, row };
}

export async function listTopByXp(
  limit: number,
): Promise<Array<{ id: string; name: string; xp: number }>> {
  return db
    .select({
      id: userTable.id,
      name: userTable.name,
      xp: userTable.xp,
    })
    .from(userTable)
    .orderBy(desc(userTable.xp))
    .limit(limit);
}
