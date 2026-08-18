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
  userName: string | null;
  userAvatar: string | null;
  lastPostUserName: string | null;
  lastPostUserAvatar: string | null;
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
}

export interface ThreadHeaderInfo {
  title: string;
  userName: string | null;
  createdAt: Date;
}

export interface ThreadClientProps {
  posts: Post[];
  threadId: string;
  threadSlug: string;
  forumSlug: string;
  forumTitle: string;
  userId: string;
  isAuthenticated: boolean;
  currentUserRole?: string;
  thread: ThreadHeaderInfo;
}
