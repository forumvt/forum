import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  forumTable,
  postTable,
  sessionTable,
  threadTable,
  userTable,
} from "@/db/schema";
import type { UserRole } from "@/lib/permissions";
import type { AdminUserItem } from "@/types/moderation";
import type { UserThreadItem } from "@/types/user";

export interface PublicUserRow {
  id: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: Date;
  bannedAt: Date | null;
  banReason: string | null;
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
      bannedAt: userTable.bannedAt,
      banReason: userTable.banReason,
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
      bannedAt: userTable.bannedAt,
      banReason: userTable.banReason,
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
    .where(and(eq(threadTable.userId, userId), isNull(threadTable.deletedAt)));
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
    .where(and(eq(threadTable.userId, userId), isNull(threadTable.deletedAt)))
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
    .where(and(eq(postTable.userId, userId), isNull(postTable.deletedAt)));
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
    .where(
      and(
        eq(postTable.userId, userId),
        isNull(postTable.deletedAt),
        isNull(threadTable.deletedAt),
      ),
    )
    .orderBy(desc(postTable.createdAt))
    .limit(per)
    .offset((page - 1) * per);

  return { posts, totalCount };
}

export async function findBanById(
  userId: string,
): Promise<{ bannedAt: Date | null; banReason: string | null } | null> {
  const [row] = await db
    .select({
      bannedAt: userTable.bannedAt,
      banReason: userTable.banReason,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return row ?? null;
}

export async function findBanByEmail(
  email: string,
): Promise<{ bannedAt: Date | null; banReason: string | null } | null> {
  const [row] = await db
    .select({
      bannedAt: userTable.bannedAt,
      banReason: userTable.banReason,
    })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  return row ?? null;
}

export async function deleteSessionsByUserId(userId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

export async function setBan(
  userId: string,
  banned: boolean,
  reason?: string | null,
): Promise<void> {
  await db
    .update(userTable)
    .set({
      bannedAt: banned ? new Date() : null,
      banReason: banned ? (reason ?? null) : null,
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, userId));
}

export async function setRole(userId: string, role: UserRole): Promise<void> {
  await db
    .update(userTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(userTable.id, userId));
}

export async function findAdminPaginated(options: {
  query?: string;
  page: number;
  per: number;
}): Promise<{ users: AdminUserItem[]; totalCount: number }> {
  const pattern = options.query?.trim()
    ? `%${options.query.trim()}%`
    : undefined;
  const searchWhere = pattern
    ? or(ilike(userTable.name, pattern), ilike(userTable.email, pattern))
    : undefined;

  const [countRow] = searchWhere
    ? await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(userTable)
        .where(searchWhere)
    : await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(userTable);
  const totalCount = countRow?.totalCount ?? 0;

  const base = db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      avatar: userTable.image,
      role: userTable.role,
      createdAt: userTable.createdAt,
      bannedAt: userTable.bannedAt,
      banReason: userTable.banReason,
    })
    .from(userTable);

  const users = await (searchWhere ? base.where(searchWhere) : base)
    .orderBy(desc(userTable.createdAt))
    .limit(options.per)
    .offset((options.page - 1) * options.per);

  return { users: users as AdminUserItem[], totalCount };
}
