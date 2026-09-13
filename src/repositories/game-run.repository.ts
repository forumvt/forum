import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { gameRunTable } from "@/db/schema";

export type GameRunStatus = "active" | "ended";

export interface GameRunRow {
  id: string;
  userId: string;
  gameSlug: string;
  status: GameRunStatus;
  wave: number;
  killStreakNoDamage: number;
  damageTakenThisWave: boolean;
  enemiesKilled: number;
  coinsCollected: number;
  chestsOpened: number;
  gameStartedCounted: boolean;
  xpAwardedThisRun: number;
  startedAt: Date;
  endedAt: Date | null;
}

export async function createRun(params: {
  userId: string;
  gameSlug: string;
}): Promise<GameRunRow> {
  const [row] = await db
    .insert(gameRunTable)
    .values({
      userId: params.userId,
      gameSlug: params.gameSlug,
    })
    .returning();
  return row;
}

export async function findById(id: string): Promise<GameRunRow | null> {
  const [row] = await db
    .select()
    .from(gameRunTable)
    .where(eq(gameRunTable.id, id))
    .limit(1);
  return row ?? null;
}

export async function findActiveForUser(
  userId: string,
  gameSlug: string,
): Promise<GameRunRow | null> {
  const [row] = await db
    .select()
    .from(gameRunTable)
    .where(
      and(
        eq(gameRunTable.userId, userId),
        eq(gameRunTable.gameSlug, gameSlug),
        eq(gameRunTable.status, "active"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateRun(
  id: string,
  patch: Partial<{
    status: GameRunStatus;
    wave: number;
    killStreakNoDamage: number;
    damageTakenThisWave: boolean;
    enemiesKilled: number;
    coinsCollected: number;
    chestsOpened: number;
    gameStartedCounted: boolean;
    xpAwardedThisRun: number;
    endedAt: Date | null;
  }>,
): Promise<GameRunRow | null> {
  const [row] = await db
    .update(gameRunTable)
    .set(patch)
    .where(eq(gameRunTable.id, id))
    .returning();
  return row ?? null;
}
