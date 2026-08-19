import { desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  forumTable,
  postTable,
  threadTable,
  userTable,
} from "@/db/schema";
import type { UserRole } from "@/lib/permissions";
import type { UserThreadItem } from "@/types/user";

export interface PublicUserRow {
  id: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: Date;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export async function updateAvatar(
  userId: string,
  imageUrl: string,
): Promise<void> {
  await db
    .update(userTable)
    .set({ image: imageUrl })
    .where(eq(userTable.id, userId));
}

export async function findRoleById(
  userId: string,
): Promise<string | undefined> {
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return row?.role;
}

export async function findPublicById(
  userId: string,
): Promise<PublicUserRow | null> {
  const [row] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
      role: userTable.role,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return (row as PublicUserRow | undefined) ?? null;
}

export async function findPublicByIds(
  userIds: string[],
): Promise<PublicUserRow[]> {
  const ids = uniqueIds(userIds);
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
      role: userTable.role,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(inArray(userTable.id, ids));

  return rows as PublicUserRow[];
}

export async function countThreadsByUserIds(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const ids = uniqueIds(userIds);
  if (ids.length === 0) return counts;
  for (const id of ids) counts.set(id, 0);

  const rows = await db
    .select({
      userId: threadTable.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(threadTable)
    .where(inArray(threadTable.userId, ids))
    .groupBy(threadTable.userId);

  for (const row of rows) {
    counts.set(row.userId, row.count);
  }
  return counts;
}

export async function countRepliesByUserIds(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const ids = uniqueIds(userIds);
  if (ids.length === 0) return counts;
  for (const id of ids) counts.set(id, 0);

  const rows = await db
    .select({
      userId: postTable.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(postTable)
    .where(inArray(postTable.userId, ids))
    .groupBy(postTable.userId);

  for (const row of rows) {
    counts.set(row.userId, row.count);
  }
  return counts;
}

export async function findThreadsByUserIdPaginated(
  userId: string,
  page: number,
  per: number,
): Promise<{ threads: UserThreadItem[]; totalCount: number }> {
  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(threadTable)
    .where(eq(threadTable.userId, userId));
  const totalCount = countRow?.totalCount ?? 0;

  const threads = await db
    .select({
      id: threadTable.id,
      title: threadTable.title,
      slug: threadTable.slug,
      description: threadTable.description,
      forumTitle: forumTable.title,
      forumSlug: forumTable.slug,
      createdAt: threadTable.createdAt,
      postsCount: sql<number>`COUNT(${postTable.id})`.mapWith(Number),
      views: threadTable.views,
    })
    .from(threadTable)
    .leftJoin(forumTable, eq(threadTable.forumId, forumTable.id))
    .leftJoin(postTable, eq(postTable.threadId, threadTable.id))
    .where(eq(threadTable.userId, userId))
    .groupBy(
      threadTable.id,
      threadTable.title,
      threadTable.slug,
      threadTable.description,
      forumTable.title,
      forumTable.slug,
      threadTable.createdAt,
      threadTable.views,
    )
    .orderBy(desc(threadTable.createdAt))
    .limit(per)
    .offset((page - 1) * per);

  return { threads, totalCount };
}

export interface UserReplyRow {
  id: string;
  content: string;
  createdAt: Date;
  threadTitle: string;
  threadSlug: string;
  forumTitle: string | null;
  forumSlug: string | null;
}

export async function findRepliesByUserIdPaginated(
  userId: string,
  page: number,
  per: number,
): Promise<{ posts: UserReplyRow[]; totalCount: number }> {
  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(postTable)
    .where(eq(postTable.userId, userId));
  const totalCount = countRow?.totalCount ?? 0;

  const posts = await db
    .select({
      id: postTable.id,
      content: postTable.content,
      createdAt: postTable.createdAt,
      threadTitle: threadTable.title,
      threadSlug: threadTable.slug,
      forumTitle: forumTable.title,
      forumSlug: forumTable.slug,
    })
    .from(postTable)
    .innerJoin(threadTable, eq(postTable.threadId, threadTable.id))
    .leftJoin(forumTable, eq(threadTable.forumId, forumTable.id))
    .where(eq(postTable.userId, userId))
    .orderBy(desc(postTable.createdAt))
    .limit(per)
    .offset((page - 1) * per);

  return { posts, totalCount };
}
