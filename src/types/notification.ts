export type NotificationType =
  | "own_thread"
  | "viewed_thread"
  | "like"
  | "reply";

export interface NotificationPreferences {
  ownThread: boolean;
  viewedThread: boolean;
  like: boolean;
  reply: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  ownThread: true,
  viewedThread: true,
  like: true,
  reply: true,
};

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actorName: string;
  actorAvatar: string | null;
  threadTitle: string;
  threadSlug: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPayload {
  unreadCount: number;
  notifications: NotificationItem[];
}
