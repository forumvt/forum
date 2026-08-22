import { db } from "@/db";
import {
  canChangeAuthor,
  canDeletePost,
  canEditPost,
  isStaff,
} from "@/lib/permissions";
import * as postRepo from "@/repositories/post.repository";
import * as threadRepo from "@/repositories/thread.repository";
import * as userRepo from "@/repositories/user.repository";
import * as moderationService from "@/services/moderation.service";
import * as notificationService from "@/services/notification.service";

export async function addReply(
  threadId: string,
  userId: string,
  content: string,
  quotedUserId?: string | null,
): Promise<
  | { ok: true; id: string }
  | {
      ok: false;
      error: "banned" | "locked" | "deleted";
      reason?: string | null;
    }
> {
  const block = await moderationService.getWriteBlock(userId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  const thread = await threadRepo.findMetaById(threadId);
  if (!thread || thread.deletedAt) return { ok: false, error: "deleted" };
  if (thread.isLocked) {
    const role = await userRepo.findRoleById(userId);
    if (!isStaff(role)) return { ok: false, error: "locked" };
  }

  const result = await db.transaction(async (tx) => {
    const dbOrTx = tx as unknown as typeof db;
    const created = await postRepo.create(dbOrTx, {
      threadId,
      userId,
      content,
    });
    await threadRepo.updateLastPost(dbOrTx, threadId, userId);
    return created;
  });

  await notificationService.notifyForReply({
    actorUserId: userId,
    threadId,
    postId: result.id,
    quotedUserId,
  });

  return { ok: true, id: result.id };
}

export interface GetPostsParams {
  threadId: string;
  page: number;
  per: number;
}

export interface GetPostsResult {
  posts: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userName: string | null;
    userAvatar: string | null;
    userId: string;
  }>;
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getPostsByThreadId(
  params: GetPostsParams,
): Promise<GetPostsResult> {
  const { threadId, page, per } = params;
  const { posts, totalCount } = await postRepo.findByThreadIdPaginated(
    db,
    threadId,
    page,
    per,
  );
  const totalPages = Math.ceil(totalCount / per) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return { posts, totalCount, totalPages, currentPage };
}

export type UpdatePostResult =
  | { ok: true; updatedAt: Date }
  | { ok: false; error: "not_found" | "forbidden" };

export async function updatePostContent(
  postId: string,
  content: string,
  actor: { id: string; role?: string },
): Promise<UpdatePostResult> {
  const post = await postRepo.findById(postId);
  if (!post || post.deletedAt) return { ok: false, error: "not_found" };
  if (!canEditPost(actor.id, actor.role, post.userId)) {
    return { ok: false, error: "forbidden" };
  }
  const updated = await postRepo.updateContent(postId, content);
  if (!updated) return { ok: false, error: "not_found" };
  return { ok: true, updatedAt: updated.updatedAt };
}

export type ChangePostAuthorResult =
  | { ok: true; author: { id: string; name: string; avatar: string | null } }
  | { ok: false; error: "not_found" | "forbidden" | "same" | "user_not_found" };

export async function changePostAuthor(
  postId: string,
  nextUserId: string,
  actor: { id: string; role?: string },
): Promise<ChangePostAuthorResult> {
  if (!canChangeAuthor(actor.role)) return { ok: false, error: "forbidden" };
  const post = await postRepo.findById(postId);
  if (!post) return { ok: false, error: "not_found" };
  if (post.userId === nextUserId) return { ok: false, error: "same" };
  const [currentUser, nextUser] = await Promise.all([
    userRepo.findPublicById(post.userId),
    userRepo.findPublicById(nextUserId),
  ]);
  if (!nextUser) return { ok: false, error: "user_not_found" };
  const updated = await postRepo.updateAuthor(postId, nextUserId);
  if (!updated) return { ok: false, error: "not_found" };
  const latestId = await postRepo.findLatestIdByThreadId(post.threadId);
  if (latestId === postId) {
    await threadRepo.updateLastPostUserId(post.threadId, nextUserId);
  }
  await moderationService.logAction({
    actorUserId: actor.id,
    action: "change_author",
    targetType: "post",
    targetId: postId,
    details: `${currentUser?.name ?? post.userId} → ${nextUser.name}`,
  });
  return {
    ok: true,
    author: { id: nextUser.id, name: nextUser.name, avatar: nextUser.avatar },
  };
}

export type DeletePostResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" };

export async function deletePost(
  postId: string,
  actor: { id: string; role?: string },
): Promise<DeletePostResult> {
  const post = await postRepo.findById(postId);
  if (!post || post.deletedAt) return { ok: false, error: "not_found" };
  if (!canDeletePost(actor.id, actor.role, post.userId)) {
    return { ok: false, error: "forbidden" };
  }
  await postRepo.softDelete(postId);
  if (isStaff(actor.role)) {
    await moderationService.logAction({
      actorUserId: actor.id,
      action: "delete_post",
      targetType: "post",
      targetId: postId,
    });
  }
  return { ok: true };
}

export async function restorePost(
  postId: string,
  actor: { id: string; role?: string },
): Promise<DeletePostResult> {
  if (!isStaff(actor.role)) return { ok: false, error: "forbidden" };
  const post = await postRepo.findById(postId);
  if (!post) return { ok: false, error: "not_found" };
  await postRepo.restore(postId);
  await moderationService.logAction({
    actorUserId: actor.id,
    action: "restore_post",
    targetType: "post",
    targetId: postId,
  });
  return { ok: true };
}
