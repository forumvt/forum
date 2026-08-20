import { Clock, MessageSquare, User } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";

import { CreateThread } from "@/components/create-thread";
import { HomeSkeleton } from "@/components/home-skeleton";
import { RightRail } from "@/components/right-rail";
import { ThreadFilters } from "@/components/thread-filters";
import { ThreadTitleWithPreview } from "@/components/thread-title-with-preview";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
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
    Math.max(1, parseInt(params?.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER)
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

  const {
    threads,
    totalCount,
    totalPages,
    currentPage,
  } = listResult;

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
            {threads.map((thread) => (
              <Card
                key={thread.id}
                id={`topico-${thread.id}`}
                className="chaos-card scroll-mt-6 bg-card transition-all duration-300 hover:shadow-lg"
              >
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
                        />
                      </div>
                      <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-3">
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
                              "pt-BR"
                            )}
                          </span>
                        </div>
                        {thread.postsCount > 0 && thread.lastPostAt && (
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
                              em{" "}
                              {new Date(thread.lastPostAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          </div>
                        )}
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
            ))}
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
