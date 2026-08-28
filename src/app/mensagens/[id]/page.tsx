import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PmAddMembers } from "@/components/pm-add-members";
import { PmComposeForm } from "@/components/pm-compose-form";
import { PmMessageList } from "@/components/pm-message-list";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { auth } from "@/lib/auth";
import * as pmService from "@/services/pm.service";
import { pmConversationTitle } from "@/types/pm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { title: "Mensagens | VT Forums" };
  }
  const { id } = await params;
  const conversation = await pmService.getConversation(
    session.user.id,
    decodeURIComponent(id),
  );
  if (!conversation) {
    return { title: "Conversa | VT Forums" };
  }
  return {
    title: `${pmConversationTitle(conversation.participants)} | VT Forums`,
  };
}

export default async function ConversaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/");
  }

  const { id } = await params;
  const conversation = await pmService.getConversation(
    session.user.id,
    decodeURIComponent(id),
  );
  if (!conversation) notFound();
  await pmService.markConversationRead(session.user.id, conversation.id);

  const title = pmConversationTitle(conversation.participants);
  const existingIds = [
    session.user.id,
    ...conversation.participants.map((person) => person.id),
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <p className="text-muted-foreground mb-4 text-sm">
        <Link href={"/mensagens" as never} className="hover:underline">
          Mensagens
        </Link>
        <span className="mx-1.5">/</span>
        {title}
      </p>

      <div className="mb-6 space-y-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {conversation.participants.map((person) => (
            <span
              key={person.id}
              className="border-border inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1"
            >
              <UserAvatarLink
                userId={person.id}
                name={person.name}
                avatar={person.avatar}
                className="size-7"
              />
              <UserNameLink
                userId={person.id}
                name={person.name}
                className="text-sm font-medium"
              />
            </span>
          ))}
        </div>
        <PmAddMembers
          conversationId={conversation.id}
          existingIds={existingIds}
        />
      </div>

      <PmMessageList messages={conversation.messages} />

      <div className="mt-6">
        <PmComposeForm conversationId={conversation.id} />
      </div>
    </main>
  );
}
