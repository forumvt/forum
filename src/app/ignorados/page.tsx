import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { IgnoredUserList } from "@/components/ignored-user-list";
import { ThreadsPagination } from "@/components/threads-pagination";
import { auth } from "@/lib/auth";
import * as ignoreService from "@/services/ignore.service";

const DEFAULT_PER = 20;

export const metadata = {
  title: "Ignorados | VT Forums",
};

async function IgnoredFeed({
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

  const { users, totalCount, totalPages, currentPage } =
    await ignoreService.listIgnored({
      userId: session.user.id,
      page,
      per,
    });

  return (
    <>
      <IgnoredUserList users={users} />
      {totalCount > per && (
        <div className="mt-6">
          <ThreadsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            per={per}
            basePath="/ignorados"
            itemLabel="usuários"
          />
        </div>
      )}
    </>
  );
}

export default function IgnoradosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="chaos-heading mb-2 text-3xl font-bold">Ignorados</h1>
        <p className="text-muted-foreground">
          Tópicos e respostas dessas pessoas ficam ocultos no fórum. Você pode
          revelar um conteúdo pontual ou designorar quando quiser.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">Carregando ignorados…</p>
        }
      >
        <IgnoredFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
