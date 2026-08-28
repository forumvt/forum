import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PmComposeForm } from "@/components/pm-compose-form";
import { auth } from "@/lib/auth";
import * as userService from "@/services/user.service";
import type { PmPerson } from "@/types/pm";

export const metadata = {
  title: "Nova mensagem | VT Forums",
};

export default async function NovaMensagemPage({
  searchParams,
}: {
  searchParams: Promise<{ para?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/");
  }

  const { para } = await searchParams;
  const recipientId = para ? decodeURIComponent(para) : "";
  let initialRecipients: PmPerson[] = [];

  if (recipientId && recipientId !== session.user.id) {
    const profile = await userService.getProfile(recipientId, session.user.id);
    if (!profile) notFound();
    initialRecipients = [
      { id: profile.id, name: profile.name, avatar: profile.avatar },
    ];
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="text-muted-foreground mb-2 text-sm">
          <Link href={"/mensagens" as never} className="hover:underline">
            Mensagens
          </Link>
          <span className="mx-1.5">/</span>
          Nova conversa
        </p>
        <h1 className="chaos-heading text-3xl font-bold">Nova mensagem</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Envie para uma pessoa ou adicione várias para criar um grupo.
        </p>
      </div>

      <PmComposeForm initialRecipients={initialRecipients} />
    </main>
  );
}
