import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PostsPagination } from "@/components/posts-pagination";
import { ThreadClient } from "@/components/thread-client-props";
import { auth } from "@/lib/auth";
import { DELETED_POST_NOTICE } from "@/lib/moderation-copy";
import { isStaff, roleLabel } from "@/lib/permissions";
import { resolveActor } from "@/lib/session-actor";
import { formatMemberSince } from "@/lib/utils";
import * as likeRepo from "@/repositories/like.repository";
import * as forumService from "@/services/forum.service";
import * as ignoreService from "@/services/ignore.service";
import * as postService from "@/services/post.service";
import * as threadService from "@/services/thread.service";
import * as userService from "@/services/user.service";
import type { Post } from "@/types/post";
import type { UserIdentity } from "@/types/user";

const DEFAULT_PER = 50;

interface ThreadPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; per?: string }>;
}

export default async function ThreadPage({
  params,
  searchParams,
}: ThreadPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { slug } = await params;

  const thread = await threadService.getThreadBySlug(slug);
  if (!thread) {
    notFound();
  }

  const actor = session?.user ? await resolveActor(session.user) : null;
  if (thread.deletedAt && !isStaff(actor?.role)) {
    notFound();
  }

  if (session?.user?.id) {
    await threadService.markThreadAsRead(thread.id, session.user.id);
  }
  await threadService.incrementThreadViews(thread.id);

  const search = (await (searchParams ?? Promise.resolve({}))) as {
    page?: string;
    per?: string;
  };
  const page = Math.max(1, parseInt(search?.page ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(
      1,
      parseInt(search?.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER,
    ),
  );

  const postsResult = await postService.getPostsByThreadId({
    threadId: thread.id,
    page,
    per,
  });

  const { posts: dbPosts, totalCount, totalPages, currentPage } = postsResult;

  const sessionUserId = session?.user?.id ?? null;
  const staffViewer = isStaff(actor?.role);

  const [threadLikes, postLikes, identities, ignoredUserIds, forums] =
    await Promise.all([
      likeRepo.findThreadLikeStats(thread.id, sessionUserId),
      likeRepo.findPostLikeStats(
        dbPosts.map((post) => post.id),
        sessionUserId,
      ),
      userService.getIdentityMap([
        thread.userId,
        ...dbPosts.map((post) => post.userId),
      ]),
      ignoreService.getIgnoredUserIdSet(sessionUserId),
      forumService.listForums(),
    ]);

  function identityFields(identity: UserIdentity | undefined) {
    return {
      title: roleLabel(identity?.role),
      joinDate: formatMemberSince(identity?.createdAt),
      posts: (identity?.postsCount ?? 0).toLocaleString("pt-BR"),
      likes: (identity?.likesReceived ?? 0).toLocaleString("pt-BR"),
    };
  }

  const threadIdentity = identities.get(thread.userId);

  const initialPost: Post = {
    id: `thread-${thread.id}`,
    author: thread.userName || "Usuário Anônimo",
    ...identityFields(threadIdentity),
    likeCount: threadLikes.count,
    likedByMe: threadLikes.likedByMe,
    content: thread.description || "",
    timestamp: new Date(thread.createdAt).toLocaleString(),
    isOriginalPoster: true,
    userAvatar: thread.userAvatar,
    signature: "",
    userId: thread.userId,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    isIgnored: ignoredUserIds.has(thread.userId),
    isDeleted: Boolean(thread.deletedAt),
  };

  const displayPosts: Post[] = [
    ...(currentPage === 1 ? [initialPost] : []),
    ...dbPosts.map((post) => {
      const likes = postLikes.get(post.id) ?? { count: 0, likedByMe: false };
      return {
        id: post.id,
        author: post.userName || "Usuário Anônimo",
        ...identityFields(identities.get(post.userId)),
        likeCount: likes.count,
        likedByMe: likes.likedByMe,
        content:
          post.deletedAt && !staffViewer ? DELETED_POST_NOTICE : post.content,
        timestamp: new Date(post.createdAt).toLocaleString(),
        isOriginalPoster: post.userId === thread.userId,
        userAvatar: post.userAvatar,
        signature: undefined,
        userId: post.userId,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        isIgnored: ignoredUserIds.has(post.userId),
        isDeleted: Boolean(post.deletedAt),
      };
    }),
  ];

  return (
    <div className="bg-background min-h-screen">
      <ThreadClient
        posts={displayPosts}
        threadId={thread.id}
        threadSlug={slug}
        forumSlug={thread.forumSlug ?? slug}
        forumTitle={thread.forumTitle ?? "Fórum"}
        forumId={thread.forumId}
        forums={forums.map((forum) => ({
          id: forum.id,
          title: forum.title,
          slug: forum.slug,
        }))}
        userId={actor?.id || ""}
        isAuthenticated={!!session?.user}
        currentUserRole={actor?.role}
        thread={{
          title: thread.title,
          userId: thread.userId,
          userName: thread.userName,
          createdAt: thread.createdAt,
          isLocked: thread.isLocked,
          isPinned: thread.isPinned,
          deletedAt: thread.deletedAt,
        }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
        <PostsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          per={per}
          basePath={`/threads/${slug}`}
        />
      </div>
    </div>
  );
}
