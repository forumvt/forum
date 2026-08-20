import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { userIgnoreTable, userTable } from "@/db/schema";
import type { IgnoredUser } from "@/types/user";

export async function toggle(
  ignorerUserId: string,
  targetUserId: string,
): Promise<{ ignored: boolean }> {
  const [existing] = await db
    .select({ id: userIgnoreTable.id })
    .from(userIgnoreTable)
    .where(
      and(
        eq(userIgnoreTable.ignorerUserId, ignorerUserId),
        eq(userIgnoreTable.targetUserId, targetUserId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(userIgnoreTable).where(eq(userIgnoreTable.id, existing.id));
    return { ignored: false };
  }

  await db.insert(userIgnoreTable).values({
    ignorerUserId,
    targetUserId,
  });
  return { ignored: true };
}

export async function isIgnored(
  ignorerUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: userIgnoreTable.id })
    .from(userIgnoreTable)
    .where(
      and(
        eq(userIgnoreTable.ignorerUserId, ignorerUserId),
        eq(userIgnoreTable.targetUserId, targetUserId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function findIgnoredUserIds(
  ignorerUserId: string,
): Promise<string[]> {
  const rows = await db
    .select({ targetUserId: userIgnoreTable.targetUserId })
    .from(userIgnoreTable)
    .where(eq(userIgnoreTable.ignorerUserId, ignorerUserId));
  return rows.map((row) => row.targetUserId);
}

export async function findIgnoredPaginated(
  ignorerUserId: string,
  page: number,
  per: number,
): Promise<{ users: IgnoredUser[]; totalCount: number }> {
  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(userIgnoreTable)
    .where(eq(userIgnoreTable.ignorerUserId, ignorerUserId));
  const totalCount = countRow?.totalCount ?? 0;

  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
      ignoredAt: userIgnoreTable.createdAt,
    })
    .from(userIgnoreTable)
    .innerJoin(userTable, eq(userTable.id, userIgnoreTable.targetUserId))
    .where(eq(userIgnoreTable.ignorerUserId, ignorerUserId))
    .orderBy(desc(userIgnoreTable.createdAt))
    .limit(per)
    .offset((page - 1) * per);

  return { users, totalCount };
}
