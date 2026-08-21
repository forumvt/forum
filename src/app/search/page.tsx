import { Clock, MessageSquare, Search, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { HighlightText } from "@/components/highlight-text";
import { HomeSkeleton } from "@/components/home-skeleton";
import {
  IGNORED_THREAD_NOTICE,
  IgnoredReveal,
} from "@/components/ignored-reveal";
import { RightRail } from "@/components/right-rail";
import { SearchForm } from "@/components/search-form";
import { ThreadTitleWithPreview } from "@/components/thread-title-with-preview";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { auth } from "@/lib/auth";
import { MIN_SEARCH_QUERY_LENGTH, normalizeSearchQuery } from "@/lib/search";
import * as threadService from "@/services/thread.service";

const DEFAULT_PER = 20;

type SearchPageParams = Promise<{ q?: string; page?: string; per?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  const params = await searchParams;
  const query = normalizeSearchQuery(params.q ?? "");
  if (!query) {
    return { title: "Pesquisar tópicos | VT Forums" };
  }
  return { title: `Pesquisa: ${query} | VT Forums` };
}

async function SearchResults({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const params = await searchParams;
  const query = normalizeSearchQuery(params.q ?? "");
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(1, parseInt(params.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER),
  );

  if (!query) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="bg-muted/50 border-border w-full min-w-0 flex-1 rounded-lg border px-4 py-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-xl font-bold">
            Busque tópicos do fórum
          </h3>
          <p className="text-muted-foreground">
            Digite um termo para encontrar tópicos pelo título ou pelo conteúdo.
          </p>
        </div>
        <aside className="w-full shrink-0 lg:w-80">
          <RightRail />
        </aside>
      </div>
    );
  }

  if (query.length < MIN_SEARCH_QUERY_LENGTH) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="bg-muted/50 border-border w-full min-w-0 flex-1 rounded-lg border px-4 py-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-xl font-bold">
            Termo muito curto
          </h3>
          <p className="text-muted-foreground">
            Digite pelo menos {MIN_SEARCH_QUERY_LENGTH} caracteres para
            pesquisar.
          </p>
        </div>
        <aside className="w-full shrink-0 lg:w-80">
          <RightRail />
        </aside>
      </div>
    );
  }

  const { threads, totalCount, totalPages, currentPage } =
    await threadService.searchThreads({
      query,
      page,
      per,
      sessionUserId: session?.user?.id ?? null,
    });

  if (threads.length === 0) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="bg-muted/50 border-border w-full min-w-0 flex-1 rounded-lg border px-4 py-12 text-center">
          <MessageSquare className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-xl font-bold">
            Nenhum tópico encontrado
          </h3>
          <p className="text-muted-foreground">
            Não há tópicos com título ou conteúdo contendo{" "}
            <span className="text-foreground font-medium">“{query}”</span>.
          </p>
        </div>
        <aside className="w-full shrink-0 lg:w-80">
          <RightRail />
        </aside>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <p className="text-muted-foreground text-sm">
          {totalCount}{" "}
          {totalCount === 1 ? "tópico encontrado" : "tópicos encontrados"} para{" "}
          <span className="text-foreground font-medium">“{query}”</span>
        </p>

        {threads.map((thread) => (
          <IgnoredReveal
            key={thread.id}
            ignored={thread.authorIgnored}
            message={IGNORED_THREAD_NOTICE}
          >
            <Card className="chaos-card bg-card transition-all duration-300 hover:shadow-lg">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                    <UserAvatarLink
                      userId={thread.userId}
                      name={thread.userName}
                      avatar={thread.userAvatar}
                      className="h-10 w-10 sm:h-12 sm:w-12"
                    />
                    <div className="sm:hidden">
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        <UserNameLink
                          userId={thread.userId}
                          name={thread.userName}
                          className="font-medium text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2">
                      <ThreadTitleWithPreview
                        title={thread.title}
                        description={thread.description}
                        slug={thread.slug}
                        isUnread={thread.isUnread}
                        highlightQuery={query}
                        isPinned={thread.isPinned}
                        isLocked={thread.isLocked}
                      />
                    </div>
                    {thread.snippet && (
                      <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                        <HighlightText text={thread.snippet} query={query} />
                      </p>
                    )}
                    <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-3">
                      {thread.forumSlug && thread.forumTitle && (
                        <Link
                          href={`/forums/${thread.forumSlug}` as never}
                          className="hover:text-primary font-medium underline-offset-2 hover:underline"
                        >
                          {thread.forumTitle}
                        </Link>
                      )}
                      <div className="hidden items-center gap-1 sm:flex">
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
                          {new Date(thread.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm sm:flex-col sm:gap-6">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Respostas:</span>
                        <span className="sm:hidden">Resp:</span>
                      </div>
                      <div className="text-foreground text-lg font-bold">
                        {thread.postsCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </IgnoredReveal>
        ))}

        <ThreadsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          per={per}
          basePath="/search"
          queryParams={{ q: query }}
        />
      </div>
      <aside className="w-full shrink-0 lg:w-80">
        <RightRail />
      </aside>
    </div>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="chaos-heading mb-2 text-3xl font-bold md:text-4xl">
          Pesquisar tópicos
        </h1>
        <p className="text-muted-foreground mb-4">
          Encontre discussões pelo título ou pelo conteúdo das mensagens.
        </p>
        <div className="max-w-2xl">
          <Suspense fallback={<Skeleton className="h-11 w-full rounded-md" />}>
            <SearchForm variant="page" />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<HomeSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
