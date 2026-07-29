"use client";

import { Clock, User } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { PostCard } from "@/components/post-card";
import { ReplyForm, ReplyFormHandle } from "@/components/reply-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { ThreadClientProps as ThreadClientPropsType } from "@/types/thread";

function ThreadHeader({
  thread,
}: {
  thread: { title: string; userName: string | null; createdAt: Date };
}) {
  return (
    <div className="chaos-card bg-primary text-primary-foreground p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold break-words md:text-3xl">
        {thread.title}
      </h1>
      <div className="flex flex-col gap-3 text-sm md:flex-row md:flex-wrap md:items-center md:gap-x-6">
        <div className="flex min-w-0 items-center gap-1">
          <User className="size-4 shrink-0" />
          <span className="hidden md:inline">Autor:</span>
          <span className="truncate font-medium">
            {thread.userName || "Usuário Anônimo"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-4 shrink-0" />
          <span className="hidden md:inline">Criado em:</span>
          <span>{new Date(thread.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </div>
  );
}
export function ThreadClient({
  posts,
  threadId,
  threadSlug,
  forumSlug,
  forumTitle,
  userId,
  isAuthenticated,
  thread,
}: ThreadClientPropsType) {
  const replyFormRef = useRef<ReplyFormHandle | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="text-center">
        <h1 className="chaos-heading text-2xl font-bold sm:text-3xl">
          Tópico de Discussão
        </h1>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/forums">Fóruns</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/forums/${forumSlug}`}>{forumTitle}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[160px] truncate sm:max-w-md">
              {thread.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ThreadHeader thread={thread} />

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              author: post.author,
              title: post.title,
              joinDate: post.joinDate,
              posts: post.posts,
              likes: post.likes,
              content: post.content,
              timestamp: post.timestamp,
              userAvatar: post.userAvatar ?? null,
              isOriginalPoster: post.isOriginalPoster,
            }}
            onReply={(user, content) =>
              replyFormRef.current?.replyTo(user, content)
            }
          />
        ))}
      </div>

      <ReplyForm
        ref={replyFormRef}
        threadId={threadId}
        userId={userId}
        isAuthenticated={isAuthenticated}
        forum={threadSlug}
      />
    </div>
  );
}
