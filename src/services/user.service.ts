import { roleLabel, toUserRole } from "@/lib/permissions";
import { excerptStart } from "@/lib/search";
import * as likeRepo from "@/repositories/like.repository";
import * as userRepo from "@/repositories/user.repository";
import * as ignoreService from "@/services/ignore.service";
import * as subscriptionService from "@/services/subscription.service";
import type {
  UserIdentity,
  UserPostItem,
  UserPreview,
  UserProfile,
  UserThreadItem,
} from "@/types/user";

export async function getIdentityMap(
  userIds: string[],
): Promise<Map<string, UserIdentity>> {
  const identities = new Map<string, UserIdentity>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return identities;

  const [users, threadCounts, replyCounts, likeCounts] = await Promise.all([
    userRepo.findPublicByIds(unique),
    userRepo.countThreadsByUserIds(unique),
    userRepo.countRepliesByUserIds(unique),
    likeRepo.findReceivedLikeCounts(unique),
  ]);

  for (const user of users) {
    const threadsCount = threadCounts.get(user.id) ?? 0;
    const repliesCount = replyCounts.get(user.id) ?? 0;
    identities.set(user.id, {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: toUserRole(user.role),
      createdAt: user.createdAt,
      postsCount: threadsCount + repliesCount,
      likesReceived: likeCounts.get(user.id) ?? 0,
    });
  }

  return identities;
}

export async function getProfile(
  userId: string,
  viewerId?: string | null,
): Promise<UserProfile | null> {
  const user = await userRepo.findPublicById(userId);
  if (!user) return null;

  const [threadCounts, replyCounts, likeCounts, subStats, ignoredByMe] =
    await Promise.all([
      userRepo.countThreadsByUserIds([userId]),
      userRepo.countRepliesByUserIds([userId]),
      likeRepo.findReceivedLikeCounts([userId]),
      subscriptionService.getSubscriptionStats(userId, viewerId),
      viewerId && viewerId !== userId
        ? ignoreService.isIgnoredBy(viewerId, userId)
        : Promise.resolve(false),
    ]);

  const threadsCount = threadCounts.get(userId) ?? 0;
  const repliesCount = replyCounts.get(userId) ?? 0;

  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    role: toUserRole(user.role),
    createdAt: user.createdAt,
    postsCount: threadsCount + repliesCount,
    likesReceived: likeCounts.get(userId) ?? 0,
    threadsCount,
    repliesCount,
    subscriberCount: subStats.subscriberCount,
    subscriptionCount: subStats.subscriptionCount,
    subscribedByMe: subStats.subscribedByMe,
    ignoredByMe,
  };
}

export async function getPreview(
  userId: string,
  viewerId?: string | null,
): Promise<UserPreview | null> {
  const profile = await getProfile(userId, viewerId);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    roleLabel: roleLabel(profile.role),
    createdAt: profile.createdAt.toISOString(),
    postsCount: profile.postsCount,
    likesReceived: profile.likesReceived,
    threadsCount: profile.threadsCount,
    subscriberCount: profile.subscriberCount,
    subscriptionCount: profile.subscriptionCount,
    subscribedByMe: profile.subscribedByMe,
    ignoredByMe: profile.ignoredByMe,
  };
}

export interface ListUserActivityParams {
  userId: string;
  page: number;
  per: number;
}

export interface ListUserThreadsResult {
  threads: UserThreadItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function listUserThreads(
  params: ListUserActivityParams,
): Promise<ListUserThreadsResult> {
  const { threads, totalCount } = await userRepo.findThreadsByUserIdPaginated(
    params.userId,
    params.page,
    params.per,
  );
  const totalPages = Math.ceil(totalCount / params.per) || 1;
  const currentPage = Math.min(Math.max(1, params.page), totalPages);
  return { threads, totalCount, totalPages, currentPage };
}

export interface ListUserPostsResult {
  posts: UserPostItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function listUserPosts(
  params: ListUserActivityParams,
): Promise<ListUserPostsResult> {
  const { posts, totalCount } = await userRepo.findRepliesByUserIdPaginated(
    params.userId,
    params.page,
    params.per,
  );
  const totalPages = Math.ceil(totalCount / params.per) || 1;
  const currentPage = Math.min(Math.max(1, params.page), totalPages);

  return {
    posts: posts.map((post) => ({
      id: post.id,
      snippet: excerptStart(post.content),
      createdAt: post.createdAt,
      threadTitle: post.threadTitle,
      threadSlug: post.threadSlug,
      forumTitle: post.forumTitle,
      forumSlug: post.forumSlug,
    })),
    totalCount,
    totalPages,
    currentPage,
  };
}
