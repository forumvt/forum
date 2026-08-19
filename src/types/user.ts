import type { UserRole } from "@/lib/permissions";

export interface UserIdentity {
  id: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: Date;
  postsCount: number;
  likesReceived: number;
}

export interface UserProfile extends UserIdentity {
  threadsCount: number;
  repliesCount: number;
}

export interface UserThreadItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  forumTitle: string | null;
  forumSlug: string | null;
  createdAt: Date;
  postsCount: number;
  views: number;
}

export interface UserPostItem {
  id: string;
  snippet: string;
  createdAt: Date;
  threadTitle: string;
  threadSlug: string;
  forumTitle: string | null;
  forumSlug: string | null;
}

export type UserProfileTab = "topics" | "posts";

export interface UserPreview {
  id: string;
  name: string;
  avatar: string | null;
  roleLabel: string;
  createdAt: string;
  postsCount: number;
  likesReceived: number;
  threadsCount: number;
}
