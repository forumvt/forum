import type { Post } from "./post";

export interface ThreadListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  createdAt: Date;
  views: number;
  lastPostAt: Date;
  postsCount: number;
  lastReadAt: Date | null;
  isUnread: boolean;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  lastPostUserId: string | null;
  lastPostUserName: string | null;
  lastPostUserAvatar: string | null;
  authorIgnored?: boolean;
  lastPostIgnored?: boolean;
  isLocked?: boolean;
  isPinned?: boolean;
}

export interface ThreadSearchItem extends ThreadListItem {
  forumTitle: string | null;
  forumSlug: string | null;
  snippet: string;
}

export interface ThreadSearchRow extends ThreadListItem {
  forumTitle: string | null;
  forumSlug: string | null;
  matchedPostContent: string | null;
}

export interface ThreadBySlug {
  id: string;
  title: string;
  slug: string;
  description: string;
  views: number;
  userId: string;
  forumId: string;
  userName: string | null;
  userAvatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  forumSlug: string;
  forumTitle: string;
  isLocked: boolean;
  isPinned: boolean;
  deletedAt: Date | null;
}

export interface ThreadHeaderInfo {
  title: string;
  userId: string;
  userName: string | null;
  createdAt: Date;
  isLocked: boolean;
  isPinned: boolean;
  deletedAt: Date | null;
}

export interface ThreadForumOption {
  id: string;
  title: string;
  slug: string;
}

export interface ThreadClientProps {
  posts: Post[];
  threadId: string;
  threadSlug: string;
  forumSlug: string;
  forumTitle: string;
  forumId: string;
  forums: ThreadForumOption[];
  userId: string;
  isAuthenticated: boolean;
  currentUserRole?: string;
  thread: ThreadHeaderInfo;
}
