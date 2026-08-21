import {
  aliasedTable,
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  forumTable,
  postTable,
  threadReadTable,
  threadTable,
  userTable,
} from "@/db/schema";
import { toIlikePattern } from "@/lib/search";
import type { FilterType } from "@/types/filters";
import type {
  ThreadBySlug,
  ThreadListItem,
  ThreadSearchRow,
} from "@/types/thread";

type Db = typeof db;

const lastPostUser = aliasedTable(userTable, "last_post_user");
const NO_SESSION_USER_ID = "__no_session__";
const visibleThreads = isNull(threadTable.deletedAt);

function andVisible(condition?: SQL) {
  return condition ? and(visibleThreads, condition) : visibleThreads;
}

export async function findBySlug(slug: string): Promise<ThreadBySlug | null> {
  const [row] = await db
    .select({
      id: threadTable.id,
      title: threadTable.title,
      slug: threadTable.slug,
      description: threadTable.description,
      views: threadTable.views,
      userId: threadTable.userId,
      forumId: threadTable.forumId,
      userName: userTable.name,
      userAvatar: userTable.image,
      createdAt: threadTable.createdAt,
      updatedAt: threadTable.updatedAt,
      forumSlug: forumTable.slug,
      forumTitle: forumTable.title,
      isLocked: threadTable.isLocked,
      isPinned: threadTable.isPinned,
      deletedAt: threadTable.deletedAt,
    })
    .from(threadTable)
    .leftJoin(userTable, eq(threadTable.userId, userTable.id))
    .leftJoin(forumTable, eq(threadTable.forumId, forumTable.id))
    .where(eq(threadTable.slug, slug))
    .limit(1);

  return row as ThreadBySlug | null;
}

export interface FindManyPaginatedOptions {
  forumId?: string;
  filter: FilterType;
  sessionUserId: string | null;
  page: number;
  per: number;
  subscribedUserIds?: string[];
}

export async function findManyPaginated(
  options: FindManyPaginatedOptions,
): Promise<{ threads: ThreadListItem[]; totalCount: number }> {
  const { forumId, filter, sessionUserId, page, per, subscribedUserIds } =
    options;
  const effectiveUserId = sessionUserId ?? NO_SESSION_USER_ID;

  const forumWhere = forumId ? eq(threadTable.forumId, forumId) : undefined;

  let totalCount: number;
  if (filter === "unanswered") {
    const baseUnanswered = db
      .select({ id: threadTable.id })
      .from(threadTable)
      .leftJoin(postTable, eq(postTable.threadId, threadTable.id));
    const rows = await baseUnanswered
      .where(andVisible(forumWhere))
      .groupBy(threadTable.id)
      .having(sql`COUNT(${postTable.id}) = 0`);
    totalCount = rows.length;
  } else if (filter === "answered-by-me" && sessionUserId) {
    const answeredWhere = andVisible(
      forumWhere
        ? and(eq(postTable.userId, sessionUserId), forumWhere)
        : eq(postTable.userId, sessionUserId),
    );
    const rows = await db
      .selectDistinct({ threadId: postTable.threadId })
      .from(postTable)
      .innerJoin(threadTable, eq(postTable.threadId, threadTable.id))
      .where(answeredWhere);
    totalCount = rows.length;
  } else if (filter === "viewed-by-me" && sessionUserId) {
    const viewedWhere = andVisible(
      forumWhere
        ? and(eq(threadReadTable.userId, sessionUserId), forumWhere)
        : eq(threadReadTable.userId, sessionUserId),
    );
    const viewedQuery = db
      .select({ totalCount: sql<number>`count(*)::int` })
      .from(threadReadTable)
      .innerJoin(threadTable, eq(threadReadTable.threadId, threadTable.id))
      .where(viewedWhere);
    const [r] = await viewedQuery;
    totalCount = r?.totalCount ?? 0;
  } else if (filter === "from-subs") {
    if (
      !sessionUserId ||
      !subscribedUserIds ||
      subscribedUserIds.length === 0
    ) {
      totalCount = 0;
    } else {
      const subWhere = forumWhere
        ? and(forumWhere, inArray(threadTable.userId, subscribedUserIds))
        : inArray(threadTable.userId, subscribedUserIds);
      const [r] = await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(threadTable)
        .where(andVisible(subWhere));
      totalCount = r?.totalCount ?? 0;
    }
  } else {
    const [r] = await db
      .select({ totalCount: sql<number>`count(*)::int` })
      .from(threadTable)
      .where(andVisible(forumWhere));
    totalCount = r?.totalCount ?? 0;
  }

  let answeredThreadIds: string[] = [];
  if (filter === "answered-by-me" && sessionUserId) {
    const answeredWhere = forumWhere
      ? and(eq(postTable.userId, sessionUserId), forumWhere)
      : eq(postTable.userId, sessionUserId);
    const rows = await db
      .selectDistinct({ threadId: postTable.threadId })
      .from(postTable)
      .innerJoin(threadTable, eq(postTable.threadId, threadTable.id))
      .where(answeredWhere);
    answeredThreadIds = rows.map((r) => r.threadId).filter(Boolean);
  }

  const filterWhere = andVisible(
    filter === "answered-by-me" && sessionUserId
      ? answeredThreadIds.length > 0
        ? forumWhere
          ? and(forumWhere, inArray(threadTable.id, answeredThreadIds))
          : inArray(threadTable.id, answeredThreadIds)
        : forumWhere
          ? and(forumWhere, sql`1 = 0`)
          : sql`1 = 0`
      : filter === "viewed-by-me" && sessionUserId
        ? forumWhere
          ? and(forumWhere, isNotNull(threadReadTable.lastReadAt))
          : isNotNull(threadReadTable.lastReadAt)
        : filter === "from-subs"
          ? !sessionUserId ||
            !subscribedUserIds ||
            subscribedUserIds.length === 0
            ? sql`1 = 0`
            : forumWhere
              ? and(forumWhere, inArray(threadTable.userId, subscribedUserIds))
              : inArray(threadTable.userId, subscribedUserIds)
          : forumWhere,
  );

  const baseQuery = db
    .select({
      id: threadTable.id,
      title: threadTable.title,
      slug: threadTable.slug,
      description: threadTable.description,
      createdAt: threadTable.createdAt,
      views: threadTable.views,
      lastPostAt: threadTable.lastPostAt,
      postsCount: sql<number>`COUNT(${postTable.id})`.mapWith(Number),
      lastReadAt: threadReadTable.lastReadAt,
      isUnread: sql<boolean>`
        ${threadReadTable.lastReadAt} IS NULL
        OR ${threadReadTable.lastReadAt} < ${threadTable.lastPostAt}
      `,
      userId: threadTable.userId,
      userName: userTable.name,
      userAvatar: userTable.image,
      lastPostUserId: threadTable.lastPostUserId,
      lastPostUserName: lastPostUser.name,
      lastPostUserAvatar: lastPostUser.image,
      isLocked: threadTable.isLocked,
      isPinned: threadTable.isPinned,
    })
    .from(threadTable)
    .leftJoin(postTable, eq(postTable.threadId, threadTable.id))
    .leftJoin(userTable, eq(threadTable.userId, userTable.id))
    .leftJoin(lastPostUser, eq(threadTable.lastPostUserId, lastPostUser.id))
    .leftJoin(
      threadReadTable,
      and(
        eq(threadReadTable.threadId, threadTable.id),
        eq(threadReadTable.userId, effectiveUserId),
      ),
    );

  const withWhere = filterWhere ? baseQuery.where(filterWhere) : baseQuery;
  const withGroupBy = withWhere.groupBy(
    threadTable.id,
    threadTable.title,
    threadReadTable.lastReadAt,
    threadTable.slug,
    threadTable.description,
    threadTable.views,
    threadTable.lastPostAt,
    threadTable.userId,
    threadTable.lastPostUserId,
    userTable.name,
    userTable.image,
    lastPostUser.name,
    lastPostUser.image,
    threadTable.isLocked,
    threadTable.isPinned,
  );
  const withHaving =
    filter === "unanswered"
      ? withGroupBy.having(sql`COUNT(${postTable.id}) = 0`)
      : withGroupBy;

  const threads = await withHaving
    .orderBy(desc(threadTable.isPinned), desc(threadTable.lastPostAt))
    .limit(per)
    .offset((page - 1) * per);

  return { threads: threads as ThreadListItem[], totalCount };
}

export interface SearchPaginatedOptions {
  query: string;
  sessionUserId: string | null;
  page: number;
  per: number;
}

export async function searchPaginated(
  options: SearchPaginatedOptions,
): Promise<{ threads: ThreadSearchRow[]; totalCount: number }> {
  const { query, sessionUserId, page, per } = options;
  const effectiveUserId = sessionUserId ?? NO_SESSION_USER_ID;
  const pattern = toIlikePattern(query);

  const postsMatch = sql`EXISTS (
    SELECT 1 FROM ${postTable}
    WHERE ${postTable.threadId} = ${threadTable.id}
      AND ${postTable.content} ILIKE ${pattern}
  )`;

  const searchWhere = or(
    ilike(threadTable.title, pattern),
    ilike(threadTable.description, pattern),
    postsMatch,
  );

  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(threadTable)
    .where(andVisible(searchWhere));
  const totalCount = countRow?.totalCount ?? 0;

  const matchedPostContent = sql<string | null>`MAX((
    CASE
      WHEN ${threadTable.description} ILIKE ${pattern} THEN ${threadTable.description}
      ELSE (
        SELECT mp.content
        FROM post mp
        WHERE mp.thread_id = ${threadTable.id}
          AND mp.content ILIKE ${pattern}
        ORDER BY mp.created_at ASC
        LIMIT 1
      )
    END
  ))`;

  const threads = await db
    .select({
      id: threadTable.id,
      title: threadTable.title,
      slug: threadTable.slug,
      description: threadTable.description,
      createdAt: threadTable.createdAt,
      views: threadTable.views,
      lastPostAt: threadTable.lastPostAt,
      postsCount: sql<number>`COUNT(${postTable.id})`.mapWith(Number),
      lastReadAt: threadReadTable.lastReadAt,
      isUnread: sql<boolean>`
        ${threadReadTable.lastReadAt} IS NULL
        OR ${threadReadTable.lastReadAt} < ${threadTable.lastPostAt}
      `,
      userId: threadTable.userId,
      userName: userTable.name,
      userAvatar: userTable.image,
      lastPostUserId: threadTable.lastPostUserId,
      lastPostUserName: lastPostUser.name,
      lastPostUserAvatar: lastPostUser.image,
      forumTitle: forumTable.title,
      forumSlug: forumTable.slug,
      isLocked: threadTable.isLocked,
      isPinned: threadTable.isPinned,
      matchedPostContent,
    })
    .from(threadTable)
    .leftJoin(postTable, eq(postTable.threadId, threadTable.id))
    .leftJoin(userTable, eq(threadTable.userId, userTable.id))
    .leftJoin(lastPostUser, eq(threadTable.lastPostUserId, lastPostUser.id))
    .leftJoin(forumTable, eq(threadTable.forumId, forumTable.id))
    .leftJoin(
      threadReadTable,
      and(
        eq(threadReadTable.threadId, threadTable.id),
        eq(threadReadTable.userId, effectiveUserId),
      ),
    )
    .where(andVisible(searchWhere))
    .groupBy(
      threadTable.id,
      threadTable.title,
      threadReadTable.lastReadAt,
      threadTable.slug,
      threadTable.description,
      threadTable.views,
      threadTable.lastPostAt,
      threadTable.createdAt,
      threadTable.userId,
      threadTable.lastPostUserId,
      userTable.name,
      userTable.image,
      lastPostUser.name,
      lastPostUser.image,
      forumTable.title,
      forumTable.slug,
      threadTable.isLocked,
      threadTable.isPinned,
    )
    .orderBy(desc(threadTable.isPinned), desc(threadTable.lastPostAt))
    .limit(per)
    .offset((page - 1) * per);

  return {
    threads: threads as ThreadSearchRow[],
    totalCount,
  };
}

export async function create(data: {
  title: string;
  slug: string;
  description: string;
  forumId: string;
  userId: string;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(threadTable)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description,
      forumId: data.forumId,
      userId: data.userId,
    })
    .returning({ id: threadTable.id });
  if (!row) throw new Error("Thread insert failed");
  return { id: row.id };
}

export async function updateLastPost(
  dbOrTx: Db,
  threadId: string,
  userId: string,
): Promise<void> {
  await dbOrTx
    .update(threadTable)
    .set({
      lastPostAt: new Date(),
      lastPostUserId: userId,
    })
    .where(eq(threadTable.id, threadId));
}

export async function incrementViews(threadId: string): Promise<void> {
  await db
    .update(threadTable)
    .set({ views: sql`${threadTable.views} + 1` })
    .where(eq(threadTable.id, threadId));
}

export async function updateDescription(
  slug: string,
  description: string,
): Promise<{ updatedAt: Date } | null> {
  const [row] = await db
    .update(threadTable)
    .set({
      description,
      updatedAt: new Date(),
    })
    .where(eq(threadTable.slug, slug))
    .returning({ updatedAt: threadTable.updatedAt });
  return row ?? null;
}

export async function markThreadAsRead(
  threadId: string,
  userId: string,
): Promise<void> {
  await db
    .insert(threadReadTable)
    .values({
      userId,
      threadId,
      lastReadAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [threadReadTable.userId, threadReadTable.threadId],
      set: { lastReadAt: new Date() },
    });
}

export async function findMetaById(threadId: string): Promise<{
  id: string;
  userId: string;
  title: string;
  slug: string;
  isLocked: boolean;
  deletedAt: Date | null;
} | null> {
  const [row] = await db
    .select({
      id: threadTable.id,
      userId: threadTable.userId,
      title: threadTable.title,
      slug: threadTable.slug,
      isLocked: threadTable.isLocked,
      deletedAt: threadTable.deletedAt,
    })
    .from(threadTable)
    .where(eq(threadTable.id, threadId))
    .limit(1);
  return row ?? null;
}

export async function findViewerUserIds(threadId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: threadReadTable.userId })
    .from(threadReadTable)
    .where(eq(threadReadTable.threadId, threadId));
  return rows.map((row) => row.userId);
}

export async function setLocked(
  threadId: string,
  isLocked: boolean,
): Promise<void> {
  await db
    .update(threadTable)
    .set({ isLocked, updatedAt: new Date() })
    .where(eq(threadTable.id, threadId));
}

export async function setPinned(
  threadId: string,
  isPinned: boolean,
): Promise<void> {
  await db
    .update(threadTable)
    .set({ isPinned, updatedAt: new Date() })
    .where(eq(threadTable.id, threadId));
}

export async function setForumId(
  threadId: string,
  forumId: string,
): Promise<void> {
  await db
    .update(threadTable)
    .set({ forumId, updatedAt: new Date() })
    .where(eq(threadTable.id, threadId));
}

export async function softDelete(threadId: string): Promise<void> {
  await db
    .update(threadTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(threadTable.id, threadId));
}

export async function restore(threadId: string): Promise<void> {
  await db
    .update(threadTable)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(threadTable.id, threadId));
}
