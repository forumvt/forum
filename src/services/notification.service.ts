import * as notificationRepo from "@/repositories/notification.repository";
import * as threadRepo from "@/repositories/thread.repository";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type NotificationsPayload,
  type NotificationType,
} from "@/types/notification";

function pickType(params: {
  userId: string;
  actorUserId: string;
  quotedUserId: string | null;
  threadAuthorId: string;
  viewerIds: Set<string>;
  prefs: NotificationPreferences;
}): NotificationType | null {
  const { userId, actorUserId, quotedUserId, threadAuthorId, viewerIds, prefs } =
    params;
  if (userId === actorUserId) return null;
  if (quotedUserId === userId && prefs.reply) return "reply";
  if (threadAuthorId === userId && prefs.ownThread) return "own_thread";
  if (viewerIds.has(userId) && prefs.viewedThread) return "viewed_thread";
  return null;
}

export async function notifyForReply(params: {
  actorUserId: string;
  threadId: string;
  postId: string;
  quotedUserId?: string | null;
}): Promise<void> {
  const thread = await threadRepo.findMetaById(params.threadId);
  if (!thread) return;

  const quotedUserId = params.quotedUserId || null;
  const viewerIds = new Set(await threadRepo.findViewerUserIds(params.threadId));
  const candidateIds = new Set<string>([
    ...viewerIds,
    thread.userId,
    ...(quotedUserId ? [quotedUserId] : []),
  ]);
  candidateIds.delete(params.actorUserId);

  const prefsByUser = await notificationRepo.findPreferencesForUserIds([
    ...candidateIds,
  ]);

  const rows: Array<{
    userId: string;
    type: NotificationType;
    actorUserId: string;
    threadId: string;
    postId: string | null;
  }> = [];

  for (const userId of candidateIds) {
    const type = pickType({
      userId,
      actorUserId: params.actorUserId,
      quotedUserId,
      threadAuthorId: thread.userId,
      viewerIds,
      prefs: prefsByUser.get(userId) ?? DEFAULT_NOTIFICATION_PREFERENCES,
    });
    if (!type) continue;
    rows.push({
      userId,
      type,
      actorUserId: params.actorUserId,
      threadId: params.threadId,
      postId: params.postId,
    });
  }

  await notificationRepo.insertMany(rows);
}

export async function notifyForLike(params: {
  recipientUserId: string;
  actorUserId: string;
  threadId: string;
  postId: string | null;
}): Promise<void> {
  if (params.recipientUserId === params.actorUserId) return;
  const prefs = await notificationRepo.findPreferences(params.recipientUserId);
  if (!prefs.like) return;

  await notificationRepo.insertMany([
    {
      userId: params.recipientUserId,
      type: "like",
      actorUserId: params.actorUserId,
      threadId: params.threadId,
      postId: params.postId,
    },
  ]);
}

export async function removeUnreadLike(params: {
  recipientUserId: string;
  actorUserId: string;
  threadId: string;
  postId: string | null;
}): Promise<void> {
  await notificationRepo.deleteUnreadLike({
    userId: params.recipientUserId,
    actorUserId: params.actorUserId,
    threadId: params.threadId,
    postId: params.postId,
  });
}

export async function listForUser(userId: string): Promise<NotificationsPayload> {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepo.findRecentForUser(userId),
    notificationRepo.countUnread(userId),
  ]);
  return { notifications, unreadCount };
}

export async function markAsRead(userId: string, id: string): Promise<void> {
  await notificationRepo.markAsRead(userId, id);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await notificationRepo.markAllAsRead(userId);
}

export async function markThreadNotificationsAsRead(
  userId: string,
  threadId: string,
): Promise<void> {
  await notificationRepo.markThreadAsRead(userId, threadId);
}

export async function getPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  return notificationRepo.findPreferences(userId);
}

export async function savePreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> {
  return notificationRepo.upsertPreferences(userId, prefs);
}
