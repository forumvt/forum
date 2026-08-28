import { Eye, MessageSquare, PlusIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ForumSkeleton } from "@/components/forum-skeleton";
import { ThreadFilters } from "@/components/thread-filters";
import { ThreadList, ThreadListItem } from "@/components/thread-list-item";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import * as forumService from "@/services/forum.service";
import * as threadService from "@/services/thread.service";
import type { FilterType } from "@/types/filters";
import type { ThreadListItem as ThreadRow } from "@/types/thread";

const DEFAULT_PER = 10;

interface ForumPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; per?: string; filter?: string }>;
}

async function ForumContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; per?: string; filter?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { slug } = await params;
  const search = (await (searchParams ?? Promise.resolve({}))) as {
    page?: string;
    per?: string;
    filter?: string;
  };
  const page = Math.max(1, parseInt(search?.page ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(
      1,
      parseInt(search?.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER,
    ),
  );
  const filter = (search?.filter as FilterType) || "all";

  const forum = await forumService.getForumBySlug(slug);
  if (!forum?.id) {
    return notFound();
  }

  const listResult = await threadService.listThreads({
    forumId: forum.id,
    filter,
    page,
    per,
    sessionUserId: session?.user?.id ?? null,
  });

  const { threads, totalCount, totalPages, currentPage } = listResult;
  const totalMessages = threads.reduce(
    (sum: number, t: ThreadRow) => sum + t.postsCount,
    0,
  );

  return (
    <>
      <div className="chaos-card bg-primary text-primary-foreground p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              {forum.title}
            </h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base">
              {forum.description}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{totalCount} Tópicos</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{totalMessages} Mensagens</span>
              </div>
            </div>
          </div>
          {session?.user && (
            <Button
              asChild
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full shrink-0 font-medium shadow-lg sm:w-auto"
            >
              <Link href={`/forums/${slug}/post-thread`}>
                <PlusIcon className="size-4 sm:size-5" />
                <span className="text-sm sm:text-base">Criar Tópico</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <ThreadFilters
        active={filter}
        basePath={`/forums/${slug}`}
        showAuthFilters={!!session?.user}
      />

      {threads.length === 0 ? (
        <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
          <MessageSquare className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-xl font-bold">
            Ainda não há tópicos
          </h3>
          <p className="text-muted-foreground mb-4">
            Este fórum aguarda seu primeiro tópico de discussão!
          </p>
          <p className="text-muted-foreground text-sm">
            Seja o primeiro a iniciar uma discussão.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <ThreadList>
            {threads.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                showViews
              />
            ))}
          </ThreadList>
          <ThreadsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            per={per}
            basePath={`/forums/${slug}`}
            queryParams={filter !== "all" ? { filter } : undefined}
          />
        </div>
      )}
    </>
  );
}

export default async function ForumDetailsPage({
  params,
  searchParams,
}: ForumPageProps) {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="chaos-heading text-2xl font-bold sm:text-3xl">
            VT Forums
          </h1>
        </div>
        <Suspense fallback={<ForumSkeleton />}>
          <ForumContent params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
