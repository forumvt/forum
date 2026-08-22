import * as ignoreRepo from "@/repositories/ignore.repository";
import * as userRepo from "@/repositories/user.repository";
import * as moderationService from "@/services/moderation.service";
import type { IgnoredUser } from "@/types/user";

export type ToggleIgnoreResult =
  | { ok: true; ignored: boolean }
  | { ok: false; error: "not_found" | "self" | "banned"; reason?: string | null };

export async function toggleIgnore(
  ignorerUserId: string,
  targetUserId: string,
): Promise<ToggleIgnoreResult> {
  const block = await moderationService.getWriteBlock(ignorerUserId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  if (ignorerUserId === targetUserId) {
    return { ok: false, error: "self" };
  }

  const target = await userRepo.findPublicById(targetUserId);
  if (!target) return { ok: false, error: "not_found" };

  const { ignored } = await ignoreRepo.toggle(ignorerUserId, targetUserId);
  return { ok: true, ignored };
}

export async function isIgnoredBy(
  ignorerUserId: string,
  targetUserId: string,
): Promise<boolean> {
  return ignoreRepo.isIgnored(ignorerUserId, targetUserId);
}

export async function findIgnoredUserIds(
  ignorerUserId: string,
): Promise<string[]> {
  return ignoreRepo.findIgnoredUserIds(ignorerUserId);
}

export async function getIgnoredUserIdSet(
  ignorerUserId?: string | null,
): Promise<Set<string>> {
  if (!ignorerUserId) return new Set();
  return new Set(await ignoreRepo.findIgnoredUserIds(ignorerUserId));
}

type IgnoreFlagItem = {
  userId: string;
  lastPostUserId?: string | null;
  lastPostUserName?: string | null;
  lastPostUserAvatar?: string | null;
};

export async function applyIgnoreFlags<T extends IgnoreFlagItem>(
  items: T[],
  sessionUserId?: string | null,
): Promise<Array<T & { authorIgnored: boolean; lastPostIgnored: boolean }>> {
  const ignoredIds = await getIgnoredUserIdSet(sessionUserId);
  return items.map((item) => {
    const authorIgnored = ignoredIds.has(item.userId);
    const lastPostIgnored = item.lastPostUserId
      ? ignoredIds.has(item.lastPostUserId)
      : false;
    return {
      ...item,
      authorIgnored,
      lastPostIgnored,
      lastPostUserId: lastPostIgnored ? null : item.lastPostUserId,
      lastPostUserName: lastPostIgnored ? null : item.lastPostUserName,
      lastPostUserAvatar: lastPostIgnored ? null : item.lastPostUserAvatar,
    };
  });
}

export interface ListIgnoredParams {
  userId: string;
  page: number;
  per: number;
}

export interface ListIgnoredResult {
  users: IgnoredUser[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function listIgnored(
  params: ListIgnoredParams,
): Promise<ListIgnoredResult> {
  const { users, totalCount } = await ignoreRepo.findIgnoredPaginated(
    params.userId,
    params.page,
    params.per,
  );
  const totalPages = Math.ceil(totalCount / params.per) || 1;
  const currentPage = Math.min(Math.max(1, params.page), totalPages);
  return { users, totalCount, totalPages, currentPage };
}
