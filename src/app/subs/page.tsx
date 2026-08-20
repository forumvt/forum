import { Clock, MessageSquare, User } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ThreadTitleWithPreview } from "@/components/thread-title-with-preview";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { auth } from "@/lib/auth";
import * as subscriptionService from "@/services/subscription.service";
import * as threadService from "@/services/thread.service";

const DEFAULT_PER = 20;

export const metadata = {
  title: "Meus subs | VT Forums",
};

async function SubsFeed({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(1, parseInt(params.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER),
  );

  const [subscriptions, listResult] = await Promise.all([
    subscriptionService.listSubscriptions({
      userId: session.user.id,
      page: 1,
      per: 24,
    }),
    threadService.listThreads({
      filter: "from-subs",
      page,
      per,
      sessionUserId: session.user.id,
    }),
  ]);

  const { threads, totalCount, totalPages, currentPage } = listResult;

  return (
    <>
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Quem você sub</h2>
        {subscriptions.users.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Passe o mouse no avatar de alguém e clique em Sub. Os tópicos
            dessa pessoa aparecem aqui.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {subscriptions.users.map((user) => (
              <div
                key={user.id}
                className="hover:bg-muted/60 flex items-center gap-2 rounded-md border px-2 py-1.5"
              >
                <UserAvatarLink
                  userId={user.id}
                  name={user.name}
                  avatar={user.avatar}
                  className="size-8"
                />
                <UserNameLink
                  userId={user.id}
                  name={user.name}
                  className="max-w-[10rem] truncate text-sm font-medium"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tópicos dos seus subs</h2>
        {threads.length === 0 ? (
          <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
            <MessageSquare className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="text-foreground mb-2 text-xl font-bold">
              Nenhum tópico ainda
            </h3>
            <p className="text-muted-foreground">
              {subscriptions.totalCount === 0
                ? "Dê sub em usuários para acompanhar o que eles publicam."
                : "Seus subs ainda não abriram tópicos."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className="chaos-card bg-card transition-all duration-300 hover:shadow-lg"
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
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>
                            {thread.postsCount.toLocaleString("pt-BR")} respostas
                          </span>
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
              basePath="/subs"
              itemLabel="tópicos"
            />
          </div>
        )}
      </section>
    </>
  );
}

export default function SubsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="chaos-heading mb-2 text-3xl font-bold">Meus subs</h1>
        <p className="text-muted-foreground">
          Acompanhe os tópicos das pessoas em que você deu sub.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">Carregando seus subs…</p>
        }
      >
        <SubsFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
