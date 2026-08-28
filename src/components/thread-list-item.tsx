import { Clock, Eye, MessageSquare, Reply, User } from "lucide-react";
import Link from "next/link";

import {
  IGNORED_THREAD_NOTICE,
  IgnoredReveal,
} from "@/components/ignored-reveal";
import { ThreadTitleWithPreview } from "@/components/thread-title-with-preview";
import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { formatReplyWhen } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { ThreadListItem as ThreadListItemType } from "@/types/thread";

export function ThreadList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border max-sm:border-t sm:space-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ThreadListItem({
  thread,
  highlightQuery,
  snippet,
  forum,
  showViews = false,
  id,
}: {
  thread: ThreadListItemType;
  highlightQuery?: string;
  snippet?: React.ReactNode;
  forum?: { slug: string; title: string };
  showViews?: boolean;
  id?: string;
}) {
  const hasLastReply = thread.postsCount > 0 && !!thread.lastPostUserId;
  const avatarUserId = hasLastReply ? thread.lastPostUserId : thread.userId;
  const avatarName = hasLastReply ? thread.lastPostUserName : thread.userName;
  const avatarSrc = hasLastReply
    ? thread.lastPostUserAvatar
    : thread.userAvatar;
  const activityName = hasLastReply ? thread.lastPostUserName : thread.userName;
  const activityUserId = hasLastReply ? thread.lastPostUserId : thread.userId;
  const activityAt = hasLastReply ? thread.lastPostAt : thread.createdAt;

  return (
    <IgnoredReveal
      ignored={thread.authorIgnored}
      message={IGNORED_THREAD_NOTICE}
    >
      <Card
        id={id}
        className={cn(
          "chaos-card bg-card max-sm:!rounded-none max-sm:!border-x-0 max-sm:!border-t-0 max-sm:!shadow-none sm:transition-all sm:duration-300 sm:hover:shadow-lg",
          id && "scroll-mt-6",
        )}
      >
        <div className="flex items-start gap-3 p-3 sm:gap-4 sm:p-6">
          <UserAvatarLink
            userId={avatarUserId}
            name={avatarName}
            avatar={avatarSrc}
            className="size-10 rounded-sm sm:size-12 sm:rounded-none"
          />

          <div className="min-w-0 flex-1">
            <ThreadTitleWithPreview
              title={thread.title}
              description={thread.description}
              slug={thread.slug}
              isUnread={thread.isUnread}
              highlightQuery={highlightQuery}
              isPinned={thread.isPinned}
              isLocked={thread.isLocked}
              className="mb-0.5 text-[15px] leading-snug sm:mb-1 sm:text-lg"
            />

            {snippet}

            <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 text-xs sm:hidden">
              <Reply className="size-3 shrink-0" aria-hidden />
              <UserNameLink
                userId={activityUserId}
                name={activityName}
                className="min-w-0 truncate font-medium"
              />
              <span className="min-w-0 truncate">
                {hasLastReply
                  ? `respondeu ${formatReplyWhen(activityAt)}`
                  : formatReplyWhen(activityAt)}
              </span>
            </div>

            <div className="text-muted-foreground mt-2 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:flex">
              {forum ? (
                <Link
                  href={`/forums/${forum.slug}` as never}
                  className="hover:text-primary font-medium underline-offset-2 hover:underline"
                >
                  {forum.title}
                </Link>
              ) : null}
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <UserNameLink
                  userId={thread.userId}
                  name={thread.userName}
                  className="font-medium text-foreground"
                />
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(thread.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {thread.postsCount > 0 && thread.lastPostAt ? (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>
                    Última resposta
                    {thread.lastPostUserName ? (
                      <>
                        {" "}
                        por{" "}
                        <UserNameLink
                          userId={thread.lastPostUserId}
                          name={thread.lastPostUserName}
                          className="font-medium text-foreground"
                        />
                      </>
                    ) : null}{" "}
                    {formatReplyWhen(thread.lastPostAt)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="text-muted-foreground flex shrink-0 items-start gap-3 pt-0.5 text-sm sm:items-center sm:gap-3">
            <div className="flex items-center gap-1">
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">Respostas:</span>
              <span className="text-muted-foreground text-sm tabular-nums sm:text-foreground sm:text-lg sm:font-bold">
                {thread.postsCount}
              </span>
            </div>
            {showViews ? (
              <div className="hidden items-center gap-1 sm:flex">
                <Eye className="h-4 w-4" />
                <span>Visualizações:</span>
                <span className="text-foreground text-lg font-bold">
                  {thread.views}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </IgnoredReveal>
  );
}
