import * as likeRepo from "@/repositories/like.repository";
import * as postRepo from "@/repositories/post.repository";
import * as threadRepo from "@/repositories/thread.repository";
import * as notificationService from "@/services/notification.service";

export type ToggleLikeResult =
  | { ok: true; liked: boolean }
  | { ok: false; error: "not_found" };

export async function togglePostLike(
  postId: string,
  actorUserId: string,
): Promise<ToggleLikeResult> {
  const post = await postRepo.findById(postId);
  if (!post) return { ok: false, error: "not_found" };

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
  const thread = await threadRepo.findBySlug(slug);
  if (!thread) return { ok: false, error: "not_found" };

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
