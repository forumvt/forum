import { db } from "@/db";
import { canEditPost } from "@/lib/permissions";
import * as postRepo from "@/repositories/post.repository";
import * as threadRepo from "@/repositories/thread.repository";
import * as notificationService from "@/services/notification.service";

export async function addReply(
  threadId: string,
  userId: string,
  content: string,
  quotedUserId?: string | null,
): Promise<{ id: string }> {
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

  return result;
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
  if (!post) return { ok: false, error: "not_found" };
  if (!canEditPost(actor.id, actor.role, post.userId)) {
    return { ok: false, error: "forbidden" };
  }
  const updated = await postRepo.updateContent(postId, content);
  if (!updated) return { ok: false, error: "not_found" };
  return { ok: true, updatedAt: updated.updatedAt };
}
