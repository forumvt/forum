import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PmInboxList } from "@/components/pm-inbox-list";
import { ThreadsPagination } from "@/components/threads-pagination";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import * as pmService from "@/services/pm.service";

const DEFAULT_PER = 20;

export const metadata = {
  title: "Mensagens | VT Forums",
};

async function Inbox({
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

  const { conversations, totalCount, totalPages, currentPage } =
    await pmService.listInbox(session.user.id, page, per);

  return (
    <>
      <PmInboxList conversations={conversations} />
      {totalCount > per && (
        <div className="mt-6">
          <ThreadsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            per={per}
            basePath="/mensagens"
            itemLabel="conversas"
          />
        </div>
      )}
    </>
  );
}

export default function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="chaos-heading mb-2 text-3xl font-bold">Mensagens</h1>
          <p className="text-muted-foreground">
            Conversas privadas com uma pessoa ou em grupo.
          </p>
        </div>
        <Button asChild>
          <Link href={"/mensagens/nova" as never}>Nova conversa</Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">
            Carregando conversas…
          </p>
        }
      >
        <Inbox searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
