import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  notificationTable,
  threadTable,
  userNotificationPreferenceTable,
  userTable,
} from "@/db/schema";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationItem,
  type NotificationPreferences,
  type NotificationType,
} from "@/types/notification";

export async function insertMany(
  rows: Array<{
    userId: string;
    type: NotificationType;
    actorUserId: string;
    threadId: string;
    postId: string | null;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(notificationTable).values(rows);
}

export async function findRecentForUser(
  userId: string,
  limit = 20,
): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      id: notificationTable.id,
      type: notificationTable.type,
      actorName: userTable.name,
      actorAvatar: userTable.image,
      threadTitle: threadTable.title,
      threadSlug: threadTable.slug,
      readAt: notificationTable.readAt,
      createdAt: notificationTable.createdAt,
    })
    .from(notificationTable)
    .leftJoin(userTable, eq(notificationTable.actorUserId, userTable.id))
    .innerJoin(threadTable, eq(notificationTable.threadId, threadTable.id))
    .where(eq(notificationTable.userId, userId))
    .orderBy(desc(notificationTable.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    actorName: row.actorName ?? "Usuário",
    actorAvatar: row.actorAvatar,
    threadTitle: row.threadTitle,
    threadSlug: row.threadSlug,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countUnread(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notificationTable)
    .where(
      and(eq(notificationTable.userId, userId), isNull(notificationTable.readAt)),
    );
  return row?.total ?? 0;
}

export async function markAsRead(userId: string, id: string): Promise<void> {
  await db
    .update(notificationTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationTable.id, id),
        eq(notificationTable.userId, userId),
        isNull(notificationTable.readAt),
      ),
    );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db
    .update(notificationTable)
    .set({ readAt: new Date() })
    .where(
      and(eq(notificationTable.userId, userId), isNull(notificationTable.readAt)),
    );
}

export async function markThreadAsRead(
  userId: string,
  threadId: string,
): Promise<void> {
  await db
    .update(notificationTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationTable.userId, userId),
        eq(notificationTable.threadId, threadId),
        isNull(notificationTable.readAt),
      ),
    );
}

export async function deleteUnreadLike(params: {
  userId: string;
  actorUserId: string;
  threadId: string;
  postId: string | null;
}): Promise<void> {
  const postFilter = params.postId
    ? eq(notificationTable.postId, params.postId)
    : isNull(notificationTable.postId);

  await db
    .delete(notificationTable)
    .where(
      and(
        eq(notificationTable.userId, params.userId),
        eq(notificationTable.actorUserId, params.actorUserId),
        eq(notificationTable.threadId, params.threadId),
        eq(notificationTable.type, "like"),
        isNull(notificationTable.readAt),
        postFilter,
      ),
    );
}

export async function findPreferencesForUserIds(
  userIds: string[],
): Promise<Map<string, NotificationPreferences>> {
  const prefs = new Map<string, NotificationPreferences>();
  if (userIds.length === 0) return prefs;

  const rows = await db
    .select({
      userId: userNotificationPreferenceTable.userId,
      ownThread: userNotificationPreferenceTable.ownThread,
      viewedThread: userNotificationPreferenceTable.viewedThread,
      like: userNotificationPreferenceTable.like,
      reply: userNotificationPreferenceTable.reply,
    })
    .from(userNotificationPreferenceTable)
    .where(inArray(userNotificationPreferenceTable.userId, userIds));

  for (const row of rows) {
    prefs.set(row.userId, {
      ownThread: row.ownThread,
      viewedThread: row.viewedThread,
      like: row.like,
      reply: row.reply,
    });
  }
  return prefs;
}

export async function findPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const [row] = await db
    .select({
      ownThread: userNotificationPreferenceTable.ownThread,
      viewedThread: userNotificationPreferenceTable.viewedThread,
      like: userNotificationPreferenceTable.like,
      reply: userNotificationPreferenceTable.reply,
    })
    .from(userNotificationPreferenceTable)
    .where(eq(userNotificationPreferenceTable.userId, userId))
    .limit(1);

  return row ?? DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function upsertPreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> {
  const [row] = await db
    .insert(userNotificationPreferenceTable)
    .values({
      userId,
      ownThread: prefs.ownThread,
      viewedThread: prefs.viewedThread,
      like: prefs.like,
      reply: prefs.reply,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userNotificationPreferenceTable.userId,
      set: {
        ownThread: prefs.ownThread,
        viewedThread: prefs.viewedThread,
        like: prefs.like,
        reply: prefs.reply,
        updatedAt: new Date(),
      },
    })
    .returning({
      ownThread: userNotificationPreferenceTable.ownThread,
      viewedThread: userNotificationPreferenceTable.viewedThread,
      like: userNotificationPreferenceTable.like,
      reply: userNotificationPreferenceTable.reply,
    });

  return row ?? prefs;
}
