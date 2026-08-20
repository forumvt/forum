import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { userSubscriptionTable, userTable } from "@/db/schema";
import type { SubscribedUser } from "@/types/user";

export async function toggle(
  subscriberUserId: string,
  targetUserId: string,
): Promise<{ subscribed: boolean }> {
  const [existing] = await db
    .select({ id: userSubscriptionTable.id })
    .from(userSubscriptionTable)
    .where(
      and(
        eq(userSubscriptionTable.subscriberUserId, subscriberUserId),
        eq(userSubscriptionTable.targetUserId, targetUserId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(userSubscriptionTable)
      .where(eq(userSubscriptionTable.id, existing.id));
    return { subscribed: false };
  }

  await db.insert(userSubscriptionTable).values({
    subscriberUserId,
    targetUserId,
  });
  return { subscribed: true };
}

export async function isSubscribed(
  subscriberUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: userSubscriptionTable.id })
    .from(userSubscriptionTable)
    .where(
      and(
        eq(userSubscriptionTable.subscriberUserId, subscriberUserId),
        eq(userSubscriptionTable.targetUserId, targetUserId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function countSubscribers(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userSubscriptionTable)
    .where(eq(userSubscriptionTable.targetUserId, userId));
  return row?.count ?? 0;
}

export async function countSubscriptions(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userSubscriptionTable)
    .where(eq(userSubscriptionTable.subscriberUserId, userId));
  return row?.count ?? 0;
}

export async function findTargetUserIds(subscriberUserId: string): Promise<string[]> {
  const rows = await db
    .select({ targetUserId: userSubscriptionTable.targetUserId })
    .from(userSubscriptionTable)
    .where(eq(userSubscriptionTable.subscriberUserId, subscriberUserId));
  return rows.map((row) => row.targetUserId);
}

export async function findSubscribersPaginated(
  userId: string,
  page: number,
  per: number,
): Promise<{ users: SubscribedUser[]; totalCount: number }> {
  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(userSubscriptionTable)
    .where(eq(userSubscriptionTable.targetUserId, userId));
  const totalCount = countRow?.totalCount ?? 0;

  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
      subscribedAt: userSubscriptionTable.createdAt,
    })
    .from(userSubscriptionTable)
    .innerJoin(
      userTable,
      eq(userTable.id, userSubscriptionTable.subscriberUserId),
    )
    .where(eq(userSubscriptionTable.targetUserId, userId))
    .orderBy(desc(userSubscriptionTable.createdAt))
    .limit(per)
    .offset((page - 1) * per);

  return { users, totalCount };
}

export async function findSubscriptionsPaginated(
  userId: string,
  page: number,
  per: number,
): Promise<{ users: SubscribedUser[]; totalCount: number }> {
  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(userSubscriptionTable)
    .where(eq(userSubscriptionTable.subscriberUserId, userId));
  const totalCount = countRow?.totalCount ?? 0;

  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
      subscribedAt: userSubscriptionTable.createdAt,
    })
    .from(userSubscriptionTable)
    .innerJoin(userTable, eq(userTable.id, userSubscriptionTable.targetUserId))
    .where(eq(userSubscriptionTable.subscriberUserId, userId))
    .orderBy(desc(userSubscriptionTable.createdAt))
    .limit(per)
    .offset((page - 1) * per);

  return { users, totalCount };
}
