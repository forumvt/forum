import * as likeRepo from "@/repositories/like.repository";
import * as postRepo from "@/repositories/post.repository";
import * as threadRepo from "@/repositories/thread.repository";
import * as moderationService from "@/services/moderation.service";
import * as notificationService from "@/services/notification.service";

export type ToggleLikeResult =
  | { ok: true; liked: boolean }
  | { ok: false; error: "not_found" | "banned"; reason?: string | null };

export async function togglePostLike(
  postId: string,
  actorUserId: string,
): Promise<ToggleLikeResult> {
  const block = await moderationService.getWriteBlock(actorUserId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  const post = await postRepo.findById(postId);
  if (!post || post.deletedAt) return { ok: false, error: "not_found" };
  const thread = await threadRepo.findMetaById(post.threadId);
  if (!thread || thread.deletedAt) return { ok: false, error: "not_found" };

  const { liked } = await likeRepo.togglePostLike(postId, actorUserId);

  if (liked) {
    await notificationService.notifyForLike({
      recipientUserId: post.userId,
      actorUserId,
      threadId: post.threadId,
      postId: post.id,
    });
  } else {
    await notificationService.removeUnreadLike({
      recipientUserId: post.userId,
      actorUserId,
      threadId: post.threadId,
      postId: post.id,
    });
  }

  return { ok: true, liked };
}

export async function toggleThreadLike(
  slug: string,
  actorUserId: string,
): Promise<ToggleLikeResult> {
  const block = await moderationService.getWriteBlock(actorUserId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  const thread = await threadRepo.findBySlug(slug);
  if (!thread || thread.deletedAt) return { ok: false, error: "not_found" };

  const { liked } = await likeRepo.toggleThreadLike(thread.id, actorUserId);

  if (liked) {
    await notificationService.notifyForLike({
      recipientUserId: thread.userId,
      actorUserId,
      threadId: thread.id,
      postId: null,
    });
  } else {
    await notificationService.removeUnreadLike({
      recipientUserId: thread.userId,
      actorUserId,
      threadId: thread.id,
      postId: null,
    });
  }

  return { ok: true, liked };
}
