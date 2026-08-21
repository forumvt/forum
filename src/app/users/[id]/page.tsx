import { Clock, MessageSquare, ThumbsUp, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProfileSkeleton } from "@/components/profile-skeleton";
import { ProfileStaffPanel } from "@/components/profile-staff-panel";
import { ProfileSubscribePanel } from "@/components/profile-subscribe-panel";
import { ReportButton } from "@/components/report-button";
import { SubscribedUserList } from "@/components/subscribed-user-list";
import { ThreadTitleWithPreview } from "@/components/thread-title-with-preview";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatarLink } from "@/components/user-link";
import { auth } from "@/lib/auth";
import { isStaff, roleLabel } from "@/lib/permissions";
import { resolveActor } from "@/lib/session-actor";
import { cn, formatMemberSince } from "@/lib/utils";
import * as subscriptionService from "@/services/subscription.service";
import * as userService from "@/services/user.service";
import type { UserProfileTab } from "@/types/user";

const DEFAULT_PER = 20;

type ProfilePageParams = Promise<{ id: string }>;
type ProfileSearchParams = Promise<{
  tab?: string;
  page?: string;
  per?: string;
}>;

function parseTab(value?: string): UserProfileTab {
  if (
    value === "posts" ||
    value === "subscribers" ||
    value === "subscriptions"
  ) {
    return value;
  }
  return "topics";
}

export async function generateMetadata({
  params,
}: {
  params: ProfilePageParams;
}) {
  const { id } = await params;
  const profile = await userService.getProfile(decodeURIComponent(id));
  if (!profile) {
    return { title: "Usuário não encontrado | VT Forums" };
  }
  return { title: `${profile.name} | VT Forums` };
}

function ProfileTabs({
  active,
  userId,
  threadsCount,
  repliesCount,
  subscriberCount,
  subscriptionCount,
}: {
  active: UserProfileTab;
  userId: string;
  threadsCount: number;
  repliesCount: number;
  subscriberCount: number;
  subscriptionCount: number;
}) {
  const tabs: { value: UserProfileTab; label: string; count: number }[] = [
    { value: "topics", label: "Tópicos", count: threadsCount },
    { value: "posts", label: "Mensagens", count: repliesCount },
    { value: "subscribers", label: "Subs", count: subscriberCount },
    { value: "subscriptions", label: "Subscritos", count: subscriptionCount },
  ];

  return (
    <nav aria-label="Atividade do perfil" className="mb-4 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        const href =
          tab.value === "topics"
            ? `/users/${encodeURIComponent(userId)}`
            : `/users/${encodeURIComponent(userId)}?tab=${tab.value}`;

        return (
          <Link
            key={tab.value}
            href={href as never}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-border focus-visible:ring-ring rounded-md border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground hover:bg-muted",
            )}
          >
            {tab.label}
            <span className="ml-2 tabular-nums opacity-80">
              {tab.count.toLocaleString("pt-BR")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

async function ProfileContent({
  params,
  searchParams,
}: {
  params: ProfilePageParams;
  searchParams: ProfileSearchParams;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id } = await params;
  const userId = decodeURIComponent(id);
  const query = await searchParams;
  const tab = parseTab(query.tab);
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(1, parseInt(query.per ?? String(DEFAULT_PER), 10) || DEFAULT_PER),
  );

  const profile = await userService.getProfile(
    userId,
    session?.user?.id ?? null,
  );
  if (!profile) notFound();

  const actor = session?.user ? await resolveActor(session.user) : null;
  const isOwnProfile = session?.user?.id === profile.id;
  const threadsResult =
    tab === "topics"
      ? await userService.listUserThreads({ userId: profile.id, page, per })
      : null;
  const postsResult =
    tab === "posts"
      ? await userService.listUserPosts({ userId: profile.id, page, per })
      : null;
  const subscribersResult =
    tab === "subscribers"
      ? await subscriptionService.listSubscribers({
          userId: profile.id,
          page,
          per,
        })
      : null;
  const subscriptionsResult =
    tab === "subscriptions"
      ? await subscriptionService.listSubscriptions({
          userId: profile.id,
          page,
          per,
        })
      : null;

  const basePath = `/users/${encodeURIComponent(profile.id)}`;
  const queryParams = tab === "topics" ? undefined : { tab };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[240px] truncate">
              {profile.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="chaos-card border-border bg-card border">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <UserAvatarLink
            userId={profile.id}
            name={profile.name}
            avatar={profile.avatar}
            className="size-24 sm:size-28"
            showHoverCard={false}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold break-words sm:text-3xl">
                  {profile.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{roleLabel(profile.role)}</Badge>
                  {profile.isBanned ? (
                    <Badge variant="destructive">Suspenso</Badge>
                  ) : null}
                  <span className="text-muted-foreground text-sm">
                    Membro desde {formatMemberSince(profile.createdAt)}
                  </span>
                </div>
              </div>
              {isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={"/settings" as never}>Editar perfil</Link>
                </Button>
              )}
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
              <div className="bg-muted/60 rounded-md px-3 py-2 text-center">
                <dt className="text-muted-foreground text-xs">Tópicos</dt>
                <dd className="text-foreground text-lg font-bold tabular-nums">
                  {profile.threadsCount.toLocaleString("pt-BR")}
                </dd>
              </div>
              <div className="bg-muted/60 rounded-md px-3 py-2 text-center">
                <dt className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
                  <MessageSquare className="size-3" />
                  Posts
                </dt>
                <dd className="text-foreground text-lg font-bold tabular-nums">
                  {profile.postsCount.toLocaleString("pt-BR")}
                </dd>
              </div>
              <div className="bg-muted/60 rounded-md px-3 py-2 text-center">
                <dt className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
                  <ThumbsUp className="size-3" />
                  Likes
                </dt>
                <dd className="text-foreground text-lg font-bold tabular-nums">
                  {profile.likesReceived.toLocaleString("pt-BR")}
                </dd>
              </div>
            </dl>

            <ProfileSubscribePanel
              userId={profile.id}
              isOwnProfile={isOwnProfile}
              initialSubscribed={profile.subscribedByMe}
              initialIgnored={profile.ignoredByMe}
              subscriberCount={profile.subscriberCount}
              subscriptionCount={profile.subscriptionCount}
            />
            {!isOwnProfile && session?.user ? (
              <div className="mt-3">
                <ReportButton targetType="user" targetId={profile.id} />
              </div>
            ) : null}
            {isStaff(actor?.role) ? (
              <ProfileStaffPanel
                targetUserId={profile.id}
                targetRole={profile.role}
                isBanned={profile.isBanned}
                viewerRole={actor?.role}
                isOwnProfile={isOwnProfile}
              />
            ) : null}
          </div>
        </div>
      </Card>

      <ProfileTabs
        active={tab}
        userId={profile.id}
        threadsCount={profile.threadsCount}
        repliesCount={profile.repliesCount}
        subscriberCount={profile.subscriberCount}
        subscriptionCount={profile.subscriptionCount}
      />

      {threadsResult ? (
        threadsResult.threads.length === 0 ? (
          <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
            <User className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="text-foreground mb-2 text-xl font-bold">
              Nenhum tópico ainda
            </h3>
            <p className="text-muted-foreground">
              {isOwnProfile
                ? "Você ainda não abriu nenhum tópico."
                : "Este usuário ainda não abriu tópicos."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threadsResult.threads.map((thread) => (
              <Card
                key={thread.id}
                className="chaos-card border-border bg-card border"
              >
                <div className="p-4 sm:p-6">
                  <div className="mb-2">
                    <ThreadTitleWithPreview
                      title={thread.title}
                      description={thread.description}
                      slug={thread.slug}
                      isUnread={false}
                    />
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {thread.forumSlug && thread.forumTitle && (
                      <Link
                        href={`/forums/${thread.forumSlug}` as never}
                        className="hover:text-primary font-medium underline-offset-2 hover:underline"
                      >
                        {thread.forumTitle}
                      </Link>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(thread.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {thread.postsCount.toLocaleString("pt-BR")} respostas
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            <ThreadsPagination
              currentPage={threadsResult.currentPage}
              totalPages={threadsResult.totalPages}
              totalItems={threadsResult.totalCount}
              per={per}
              basePath={basePath}
              queryParams={queryParams}
              itemLabel="tópicos"
            />
          </div>
        )
      ) : null}

      {postsResult ? (
        postsResult.posts.length === 0 ? (
          <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
            <MessageSquare className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="text-foreground mb-2 text-xl font-bold">
              Nenhuma mensagem ainda
            </h3>
            <p className="text-muted-foreground">
              {isOwnProfile
                ? "Você ainda não respondeu a nenhum tópico."
                : "Este usuário ainda não respondeu a nenhum tópico."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {postsResult.posts.map((post) => (
              <Card
                key={post.id}
                className="chaos-card border-border bg-card border"
              >
                <div className="p-4 sm:p-6">
                  <Link
                    href={`/threads/${post.threadSlug}` as never}
                    className="text-foreground hover:text-primary font-semibold underline-offset-2 hover:underline"
                  >
                    {post.threadTitle}
                  </Link>
                  {post.snippet && (
                    <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                      {post.snippet}
                    </p>
                  )}
                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {post.forumSlug && post.forumTitle && (
                      <Link
                        href={`/forums/${post.forumSlug}` as never}
                        className="hover:text-primary font-medium underline-offset-2 hover:underline"
                      >
                        {post.forumTitle}
                      </Link>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(post.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            <ThreadsPagination
              currentPage={postsResult.currentPage}
              totalPages={postsResult.totalPages}
              totalItems={postsResult.totalCount}
              per={per}
              basePath={basePath}
              queryParams={queryParams}
              itemLabel="mensagens"
            />
          </div>
        )
      ) : null}
      {subscribersResult ? (
        <div className="space-y-4">
          <SubscribedUserList
            users={subscribersResult.users}
            emptyTitle="Nenhum sub ainda"
            emptyDescription={
              isOwnProfile
                ? "Ninguém deu sub em você ainda."
                : "Ninguém deu sub neste usuário ainda."
            }
          />
          <ThreadsPagination
            currentPage={subscribersResult.currentPage}
            totalPages={subscribersResult.totalPages}
            totalItems={subscribersResult.totalCount}
            per={per}
            basePath={basePath}
            queryParams={queryParams}
            itemLabel="subs"
          />
        </div>
      ) : null}

      {subscriptionsResult ? (
        <div className="space-y-4">
          <SubscribedUserList
            users={subscriptionsResult.users}
            emptyTitle="Nenhum subscrito"
            emptyDescription={
              isOwnProfile
                ? "Você ainda não deu sub em ninguém."
                : "Este usuário ainda não deu sub em ninguém."
            }
          />
          <ThreadsPagination
            currentPage={subscriptionsResult.currentPage}
            totalPages={subscriptionsResult.totalPages}
            totalItems={subscriptionsResult.totalCount}
            per={per}
            basePath={basePath}
            queryParams={queryParams}
            itemLabel="subscritos"
          />
        </div>
      ) : null}
    </>
  );
}

export default function UserProfilePage({
  params,
  searchParams,
}: {
  params: ProfilePageParams;
  searchParams: ProfileSearchParams;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
