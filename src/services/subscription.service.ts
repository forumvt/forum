import * as subscriptionRepo from "@/repositories/subscription.repository";
import * as userRepo from "@/repositories/user.repository";
import * as moderationService from "@/services/moderation.service";
import type { SubscribedUser } from "@/types/user";

export type ToggleSubscribeResult =
  | { ok: true; subscribed: boolean; subscriberCount: number }
  | { ok: false; error: "not_found" | "self" | "banned"; reason?: string | null };

export async function toggleSubscribe(
  subscriberUserId: string,
  targetUserId: string,
): Promise<ToggleSubscribeResult> {
  const block = await moderationService.getWriteBlock(subscriberUserId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  if (subscriberUserId === targetUserId) {
    return { ok: false, error: "self" };
  }

  const target = await userRepo.findPublicById(targetUserId);
  if (!target) return { ok: false, error: "not_found" };

  const { subscribed } = await subscriptionRepo.toggle(
    subscriberUserId,
    targetUserId,
  );
  const subscriberCount = await subscriptionRepo.countSubscribers(targetUserId);
  return { ok: true, subscribed, subscriberCount };
}

export async function getSubscriptionStats(
  userId: string,
  viewerId?: string | null,
): Promise<{
  subscriberCount: number;
  subscriptionCount: number;
  subscribedByMe: boolean;
}> {
  const [subscriberCount, subscriptionCount, subscribedByMe] = await Promise.all([
    subscriptionRepo.countSubscribers(userId),
    subscriptionRepo.countSubscriptions(userId),
    viewerId && viewerId !== userId
      ? subscriptionRepo.isSubscribed(viewerId, userId)
      : Promise.resolve(false),
  ]);
  return { subscriberCount, subscriptionCount, subscribedByMe };
}

export async function findTargetUserIds(
  subscriberUserId: string,
): Promise<string[]> {
  return subscriptionRepo.findTargetUserIds(subscriberUserId);
}

export interface ListSubsParams {
  userId: string;
  page: number;
  per: number;
}

export interface ListSubsResult {
  users: SubscribedUser[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

function paginateMeta(totalCount: number, page: number, per: number) {
  const totalPages = Math.ceil(totalCount / per) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return { totalCount, totalPages, currentPage };
}

export async function listSubscribers(
  params: ListSubsParams,
): Promise<ListSubsResult> {
  const { users, totalCount } = await subscriptionRepo.findSubscribersPaginated(
    params.userId,
    params.page,
    params.per,
  );
  return { users, ...paginateMeta(totalCount, params.page, params.per) };
}

export async function listSubscriptions(
  params: ListSubsParams,
): Promise<ListSubsResult> {
  const { users, totalCount } =
    await subscriptionRepo.findSubscriptionsPaginated(
      params.userId,
      params.page,
      params.per,
    );
  return { users, ...paginateMeta(totalCount, params.page, params.per) };
}
