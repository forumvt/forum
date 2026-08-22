import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ModerationReportsTable } from "@/components/moderation-reports-table";
import { ModerationUsersTable } from "@/components/moderation-users-table";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { canAssignRole, isStaff } from "@/lib/permissions";
import { resolveActor } from "@/lib/session-actor";
import { cn } from "@/lib/utils";
import * as moderationService from "@/services/moderation.service";

type ModerationTab = "visao" | "usuarios" | "denuncias" | "registro";

function parseTab(value?: string): ModerationTab {
  if (value === "usuarios" || value === "denuncias" || value === "registro") {
    return value;
  }
  return "visao";
}

const tabs: { value: ModerationTab; label: string }[] = [
  { value: "visao", label: "Visão geral" },
  { value: "usuarios", label: "Usuários" },
  { value: "denuncias", label: "Denúncias" },
  { value: "registro", label: "Registro" },
];

const actionLabel: Record<string, string> = {
  lock: "Trancou tópico",
  unlock: "Destrancou tópico",
  pin: "Fixou tópico",
  unpin: "Desafixou tópico",
  move: "Moveu tópico",
  delete_thread: "Excluiu tópico",
  restore_thread: "Restaurou tópico",
  delete_post: "Excluiu resposta",
  restore_post: "Restaurou resposta",
  ban: "Suspendeu usuário",
  unban: "Reativou usuário",
  role_change: "Alterou cargo",
  change_author: "Alterou autor",
  resolve_report: "Resolveu denúncia",
  dismiss_report: "Dispensou denúncia",
};

export const metadata = {
  title: "Moderação | VT Forums",
};

export default async function ModeracaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; q?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/");
  const actor = await resolveActor(session.user);
  if (!isStaff(actor.role)) redirect("/");

  const params = await searchParams;
  const tab = parseTab(params.tab);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";

  const [overview, users, reports, logs] = await Promise.all([
    tab === "visao" ? moderationService.getOverview() : null,
    tab === "usuarios"
      ? moderationService.listUsers({ query, page, per: 20 })
      : null,
    tab === "denuncias"
      ? moderationService.listReports({ status: "open", page, per: 20 })
      : null,
    tab === "registro" ? moderationService.listLogs(page, 30) : null,
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="chaos-heading mb-2 text-3xl font-bold">
          Moderação e Administração
        </h1>
        <p className="text-muted-foreground">
          Trancar, fixar e remover conteúdo; gerenciar denúncias e contas.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.value}
            href={
              (item.value === "visao"
                ? "/moderacao"
                : `/moderacao?tab=${item.value}`) as never
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === item.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Denúncias abertas" value={overview.openReports} />
          <Stat title="Contas suspensas" value={overview.bannedUsers} />
          <Stat title="Tópicos trancados" value={overview.lockedThreads} />
          <Stat title="Tópicos removidos" value={overview.deletedThreads} />
        </div>
      ) : null}

      {users ? (
        <div className="space-y-4">
          <form className="flex gap-2" action="/moderacao">
            <input type="hidden" name="tab" value="usuarios" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar nome ou e-mail"
              className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground h-9 rounded-md px-3 text-sm"
            >
              Buscar
            </button>
          </form>
          <ModerationUsersTable
            users={users.users}
            canAssignRole={canAssignRole(actor.role)}
            actorRole={actor.role}
          />
        </div>
      ) : null}

      {reports ? <ModerationReportsTable reports={reports.reports} /> : null}

      {logs ? (
        <div className="space-y-3">
          {logs.logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma ação registrada ainda.
            </p>
          ) : (
            logs.logs.map((log) => (
              <Card
                key={log.id}
                className="chaos-card border-border bg-card border p-4"
              >
                <p className="text-sm font-medium">
                  {actionLabel[log.action] ?? log.action}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {log.actorName ?? "Equipe"} ·{" "}
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                  {log.details ? ` · ${log.details}` : ""}
                </p>
              </Card>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card className="chaos-card border-border bg-card border p-4">
      <p className="text-muted-foreground text-xs">{title}</p>
      <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
        {value.toLocaleString("pt-BR")}
      </p>
    </Card>
  );
}
