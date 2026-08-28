import { MessageSquare } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ThreadList, ThreadListItem } from "@/components/thread-list-item";
import { ThreadsPagination } from "@/components/threads-pagination";
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
            Passe o mouse no avatar de alguém e clique em Sub. Os tópicos dessa
            pessoa aparecem aqui.
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
            <ThreadList>
              {threads.map((thread) => (
                <ThreadListItem key={thread.id} thread={thread} />
              ))}
            </ThreadList>
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
