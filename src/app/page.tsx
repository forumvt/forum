import { MessageSquare } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";

import { CreateThread } from "@/components/create-thread";
import { HomeSkeleton } from "@/components/home-skeleton";
import { RightRail } from "@/components/right-rail";
import { ThreadFilters } from "@/components/thread-filters";
import { ThreadList, ThreadListItem } from "@/components/thread-list-item";
import { ThreadsPagination } from "@/components/threads-pagination";
import { auth } from "@/lib/auth";
import * as forumService from "@/services/forum.service";
import * as threadService from "@/services/thread.service";
import type { FilterType } from "@/types/filters";

const DEFAULT_PER = 20;

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string; filter?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(
      1,
      parseInt(params?.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER,
    ),
  );
  const filter = (params?.filter as FilterType) || "all";

  const [forums, listResult] = await Promise.all([
    forumService.listForums(),
    threadService.listThreads({
      filter,
      page,
      per,
      sessionUserId: session?.user?.id ?? null,
    }),
  ]);

  const { threads, totalCount, totalPages, currentPage } = listResult;

  const basePath = "/";

  return (
    <>
      <div className="mb-6">
        {session?.user && <CreateThread forums={forums} />}
      </div>

      <ThreadFilters
        active={filter}
        basePath={basePath}
        showAuthFilters={!!session?.user}
      />

      <div
        id="lista-topicos"
        className="flex flex-col gap-8 scroll-mt-4 lg:flex-row"
      >
        {threads.length === 0 ? (
          <div className="bg-muted/50 border-border w-full flex-1 rounded-lg border px-4 py-12 text-center">
            <MessageSquare className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="text-foreground mb-2 text-xl font-bold">
              {filter === "from-subs"
                ? "Nada dos seus subs"
                : "Ainda não há tópicos"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === "from-subs"
                ? "Dê sub em alguém para ver os tópicos deles aqui."
                : "Este fórum aguarda seu primeiro tópico de discussão!"}
            </p>
            {filter !== "from-subs" && (
              <p className="text-muted-foreground text-sm">
                Seja o primeiro a iniciar uma discussão.
              </p>
            )}
          </div>
        ) : (
          <div className="min-w-0 flex-1 space-y-4">
            <ThreadList>
              {threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  id={`topico-${thread.id}`}
                />
              ))}
            </ThreadList>
            <ThreadsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              per={per}
              basePath="/"
              queryParams={filter !== "all" ? { filter } : undefined}
            />
          </div>
        )}

        <aside className="w-full shrink-0 lg:w-80">
          <RightRail />
        </aside>
      </div>
    </>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-8 text-center">
        <h1 className="chaos-heading mb-2 text-4xl font-bold md:text-5xl">
          VT Forums
        </h1>
        <p className="text-muted-foreground text-lg">Bem-vindo ao fórum</p>
        <p className="text-primary mt-1 text-sm font-medium tracking-widest uppercase">
          All Hail Eris! All Hail Discordia!
        </p>
      </div>
      <h2 className="text-foreground mb-4 text-2xl font-bold">
        Fóruns de Discussão
      </h2>
      <p className="text-muted-foreground mb-6">
        Participe de discussões sobre diversos temas. Mantenha o respeito e
        contribua com conteúdo de qualidade.
      </p>

      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
