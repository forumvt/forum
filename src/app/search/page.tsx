import { MessageSquare, Search } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";

import { HighlightText } from "@/components/highlight-text";
import { HomeSkeleton } from "@/components/home-skeleton";
import { RightRail } from "@/components/right-rail";
import { SearchForm } from "@/components/search-form";
import { ThreadList, ThreadListItem } from "@/components/thread-list-item";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Skeleton } from "@/components/ui/skeleton";
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

        <ThreadList>
          {threads.map((thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              highlightQuery={query}
              forum={
                thread.forumSlug && thread.forumTitle
                  ? { slug: thread.forumSlug, title: thread.forumTitle }
                  : undefined
              }
              snippet={
                thread.snippet ? (
                  <p className="text-muted-foreground mb-1 line-clamp-1 text-sm sm:mb-2 sm:line-clamp-2">
                    <HighlightText text={thread.snippet} query={query} />
                  </p>
                ) : null
              }
            />
          ))}
        </ThreadList>

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
