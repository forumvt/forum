import { assertWriteAbuseChecks } from "@/lib/abuse-guard";
import { recordContentSent } from "@/lib/anti-spam";
import {
  canChangeAuthor,
  canDeleteThread,
  canEditPost,
  canModerateContent,
  isStaff,
} from "@/lib/permissions";
import type { WriteAbuseError } from "@/lib/rate-limit";
import {
  excerptAroundMatch,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from "@/lib/search";
import * as threadRepo from "@/repositories/thread.repository";
import * as userRepo from "@/repositories/user.repository";
import * as ignoreService from "@/services/ignore.service";
import * as moderationService from "@/services/moderation.service";
import * as notificationService from "@/services/notification.service";
import * as subscriptionService from "@/services/subscription.service";
import type { FilterType } from "@/types/filters";
import type {
  ThreadBySlug,
  ThreadListItem,
  ThreadSearchItem,
} from "@/types/thread";

function generateSlug(title: string): string {
  const randomString = Math.random().toString(36).substring(2, 7);
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim() + `-${randomString}`
  );
}

export interface ListThreadsParams {
  forumId?: string;
  filter: FilterType;
  page: number;
  per: number;
  sessionUserId: string | null;
}

export interface ListThreadsResult {
  threads: ThreadListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function listThreads(
  params: ListThreadsParams,
): Promise<ListThreadsResult> {
  const { forumId, filter, page, per, sessionUserId } = params;

  let subscribedUserIds: string[] | undefined;
  if (filter === "from-subs") {
    if (!sessionUserId) {
      return { threads: [], totalCount: 0, totalPages: 1, currentPage: 1 };
    }
    subscribedUserIds =
      await subscriptionService.findTargetUserIds(sessionUserId);
    if (subscribedUserIds.length === 0) {
      return { threads: [], totalCount: 0, totalPages: 1, currentPage: 1 };
    }
  }

  const { threads, totalCount } = await threadRepo.findManyPaginated({
    forumId,
    filter,
    sessionUserId,
    page,
    per,
    subscribedUserIds,
  });
  const totalPages = Math.ceil(totalCount / per) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    threads: await ignoreService.applyIgnoreFlags(threads, sessionUserId),
    totalCount,
    totalPages,
    currentPage,
  };
}

export interface SearchThreadsParams {
  query: string;
  page: number;
  per: number;
  sessionUserId: string | null;
}

export interface SearchThreadsResult {
  query: string;
  threads: ThreadSearchItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function searchThreads(
  params: SearchThreadsParams,
): Promise<SearchThreadsResult> {
  const query = normalizeSearchQuery(params.query);
  if (query.length < MIN_SEARCH_QUERY_LENGTH) {
    return {
      query,
      threads: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }

  const { threads, totalCount } = await threadRepo.searchPaginated({
    query,
    sessionUserId: params.sessionUserId,
    page: params.page,
    per: params.per,
  });

  const totalPages = Math.ceil(totalCount / params.per) || 1;
  const currentPage = Math.min(Math.max(1, params.page), totalPages);

  const mapped = threads.map((thread) => {
    const { matchedPostContent, ...rest } = thread;
    const source = matchedPostContent || rest.description;
    return {
      ...rest,
      snippet: excerptAroundMatch(source, query),
    };
  });

  return {
    query,
    threads: await ignoreService.applyIgnoreFlags(mapped, params.sessionUserId),
    totalCount,
    totalPages,
    currentPage,
  };
}

export async function getThreadBySlug(
  slug: string,
): Promise<ThreadBySlug | null> {
  return threadRepo.findBySlug(slug);
}

export async function getThreadForApi(
  slug: string,
): Promise<ThreadBySlug | null> {
  const thread = await threadRepo.findBySlug(slug);
  if (!thread || thread.deletedAt) return null;
  return thread;
}

export async function createThread(data: {
  title: string;
  description: string;
  forumId: string;
  userId: string;
}): Promise<
  | { id: string }
  | {
      error: "banned" | WriteAbuseError;
      reason?: string | null;
      retryAfterSeconds?: number;
    }
> {
  const block = await moderationService.getWriteBlock(data.userId);
  if (block.blocked) {
    return { error: "banned", reason: block.reason };
  }

  const abuse = await assertWriteAbuseChecks(data.userId, {
    rateLimit: "threadCreate",
    flood: "threadCreate",
    content: data.description,
  });
  if (!abuse.ok) {
    return {
      error: abuse.error,
      retryAfterSeconds: abuse.retryAfterSeconds,
    };
  }

  const slug = generateSlug(data.title);
  const created = await threadRepo.create({
    title: data.title,
    slug,
    description: data.description,
    forumId: data.forumId,
    userId: data.userId,
  });

  await recordContentSent(data.userId, data.description);

  return created;
}

export async function markThreadAsRead(
  threadId: string,
  userId: string,
): Promise<void> {
  await threadRepo.markThreadAsRead(threadId, userId);
  await notificationService.markThreadNotificationsAsRead(userId, threadId);
}

export async function incrementThreadViews(threadId: string): Promise<void> {
  return threadRepo.incrementViews(threadId);
}

export type UpdateOriginalPostResult =
  | { ok: true; updatedAt: Date }
  | { ok: false; error: "not_found" | "forbidden" | "banned"; reason?: string | null };

export async function updateOriginalPost(
  slug: string,
  description: string,
  actor: { id: string; role?: string },
): Promise<UpdateOriginalPostResult> {
  const block = await moderationService.getWriteBlock(actor.id);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  const thread = await threadRepo.findBySlug(slug);
  if (!thread || thread.deletedAt) return { ok: false, error: "not_found" };
  if (!canEditPost(actor.id, actor.role, thread.userId)) {
    return { ok: false, error: "forbidden" };
  }
  const updated = await threadRepo.updateDescription(slug, description);
  if (!updated) return { ok: false, error: "not_found" };
  return { ok: true, updatedAt: updated.updatedAt };
}

export type ChangeAuthorResult =
  | { ok: true; author: { id: string; name: string; avatar: string | null } }
  | { ok: false; error: "not_found" | "forbidden" | "same" | "user_not_found" };

export async function changeThreadAuthor(
  slug: string,
  nextUserId: string,
  actor: { id: string; role?: string },
): Promise<ChangeAuthorResult> {
  if (!canChangeAuthor(actor.role)) return { ok: false, error: "forbidden" };
  const thread = await threadRepo.findBySlug(slug);
  if (!thread) return { ok: false, error: "not_found" };
  if (thread.userId === nextUserId) return { ok: false, error: "same" };
  const nextUser = await userRepo.findPublicById(nextUserId);
  if (!nextUser) return { ok: false, error: "user_not_found" };
  const updated = await threadRepo.updateAuthor(slug, nextUserId);
  if (!updated) return { ok: false, error: "not_found" };
  await moderationService.logAction({
    actorUserId: actor.id,
    action: "change_author",
    targetType: "thread",
    targetId: thread.id,
    details: `${thread.userName ?? thread.userId} → ${nextUser.name}`,
  });
  return {
    ok: true,
    author: { id: nextUser.id, name: nextUser.name, avatar: nextUser.avatar },
  };
}

export type ModerateThreadAction =
  | "lock"
  | "unlock"
  | "pin"
  | "unpin"
  | "move"
  | "delete"
  | "restore";

export type ModerateThreadResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "forbidden" | "invalid" | "banned";
      reason?: string | null;
    };

export async function moderateThread(
  slug: string,
  actor: { id: string; role?: string },
  payload: { action: ModerateThreadAction; forumId?: string },
): Promise<ModerateThreadResult> {
  const thread = await threadRepo.findBySlug(slug);
  if (!thread) return { ok: false, error: "not_found" };

  if (payload.action === "delete") {
    if (!canDeleteThread(actor.id, actor.role, thread.userId)) {
      return { ok: false, error: "forbidden" };
    }
    if (!isStaff(actor.role)) {
      const block = await moderationService.getWriteBlock(actor.id);
      if (block.blocked) {
        return { ok: false, error: "banned", reason: block.reason };
      }
    }
    await threadRepo.softDelete(thread.id);
    await moderationService.logAction({
      actorUserId: actor.id,
      action: "delete_thread",
      targetType: "thread",
      targetId: thread.id,
      details: thread.title,
    });
    return { ok: true };
  }

  if (!canModerateContent(actor.role)) {
    return { ok: false, error: "forbidden" };
  }

  if (payload.action === "restore") {
    await threadRepo.restore(thread.id);
    await moderationService.logAction({
      actorUserId: actor.id,
      action: "restore_thread",
      targetType: "thread",
      targetId: thread.id,
    });
    return { ok: true };
  }

  if (payload.action === "lock" || payload.action === "unlock") {
    await threadRepo.setLocked(thread.id, payload.action === "lock");
    await moderationService.logAction({
      actorUserId: actor.id,
      action: payload.action,
      targetType: "thread",
      targetId: thread.id,
    });
    return { ok: true };
  }

  if (payload.action === "pin" || payload.action === "unpin") {
    await threadRepo.setPinned(thread.id, payload.action === "pin");
    await moderationService.logAction({
      actorUserId: actor.id,
      action: payload.action,
      targetType: "thread",
      targetId: thread.id,
    });
    return { ok: true };
  }

  if (payload.action === "move") {
    if (!payload.forumId) return { ok: false, error: "invalid" };
    const exists = await moderationService.forumExists(payload.forumId);
    if (!exists) return { ok: false, error: "invalid" };
    await threadRepo.setForumId(thread.id, payload.forumId);
    await moderationService.logAction({
      actorUserId: actor.id,
      action: "move",
      targetType: "thread",
      targetId: thread.id,
      details: payload.forumId,
    });
    return { ok: true };
  }

  return { ok: false, error: "invalid" };
}
