import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { postLikeTable, postTable, threadLikeTable, threadTable } from "@/db/schema";

export interface LikeStats {
  count: number;
  likedByMe: boolean;
}

export async function togglePostLike(
  postId: string,
  userId: string,
): Promise<{ liked: boolean }> {
  const [existing] = await db
    .select({ id: postLikeTable.id })
    .from(postLikeTable)
    .where(
      and(eq(postLikeTable.postId, postId), eq(postLikeTable.userId, userId)),
    )
    .limit(1);

  if (existing) {
    await db.delete(postLikeTable).where(eq(postLikeTable.id, existing.id));
    return { liked: false };
  }

  await db.insert(postLikeTable).values({ postId, userId });
  return { liked: true };
}

export async function toggleThreadLike(
  threadId: string,
  userId: string,
): Promise<{ liked: boolean }> {
  const [existing] = await db
    .select({ id: threadLikeTable.id })
    .from(threadLikeTable)
    .where(
      and(
        eq(threadLikeTable.threadId, threadId),
        eq(threadLikeTable.userId, userId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(threadLikeTable)
      .where(eq(threadLikeTable.id, existing.id));
    return { liked: false };
  }

  await db.insert(threadLikeTable).values({ threadId, userId });
  return { liked: true };
}

export async function findPostLikeStats(
  postIds: string[],
  userId: string | null,
): Promise<Map<string, LikeStats>> {
  const stats = new Map<string, LikeStats>();
  if (postIds.length === 0) return stats;

  const counts = await db
    .select({
      postId: postLikeTable.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(postLikeTable)
    .where(inArray(postLikeTable.postId, postIds))
    .groupBy(postLikeTable.postId);

  for (const id of postIds) {
    stats.set(id, { count: 0, likedByMe: false });
  }
  for (const row of counts) {
    stats.set(row.postId, { count: row.count, likedByMe: false });
  }

  if (userId) {
    const mine = await db
      .select({ postId: postLikeTable.postId })
      .from(postLikeTable)
      .where(
        and(
          eq(postLikeTable.userId, userId),
          inArray(postLikeTable.postId, postIds),
        ),
      );
    for (const row of mine) {
      const current = stats.get(row.postId) ?? { count: 0, likedByMe: false };
      stats.set(row.postId, { ...current, likedByMe: true });
    }
  }

  return stats;
}

export async function findThreadLikeStats(
  threadId: string,
  userId: string | null,
): Promise<LikeStats> {
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(threadLikeTable)
    .where(eq(threadLikeTable.threadId, threadId));

  let likedByMe = false;
  if (userId) {
    const [mine] = await db
      .select({ id: threadLikeTable.id })
      .from(threadLikeTable)
      .where(
        and(
          eq(threadLikeTable.threadId, threadId),
          eq(threadLikeTable.userId, userId),
        ),
      )
      .limit(1);
    likedByMe = Boolean(mine);
  }

  return { count: countRow?.count ?? 0, likedByMe };
}

export async function findReceivedLikeCounts(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (userIds.length === 0) return counts;
  for (const id of userIds) counts.set(id, 0);

  const postCounts = await db
    .select({
      userId: postTable.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(postLikeTable)
    .innerJoin(postTable, eq(postLikeTable.postId, postTable.id))
    .where(inArray(postTable.userId, userIds))
    .groupBy(postTable.userId);

  const threadCounts = await db
    .select({
      userId: threadTable.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(threadLikeTable)
    .innerJoin(threadTable, eq(threadLikeTable.threadId, threadTable.id))
    .where(inArray(threadTable.userId, userIds))
    .groupBy(threadTable.userId);

  for (const row of postCounts) {
    counts.set(row.userId, (counts.get(row.userId) ?? 0) + row.count);
  }
  for (const row of threadCounts) {
    counts.set(row.userId, (counts.get(row.userId) ?? 0) + row.count);
  }

  return counts;
}
