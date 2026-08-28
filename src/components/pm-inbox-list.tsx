import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { pmConversationPath } from "@/lib/app-url";
import { cn, displayUserName, userInitials } from "@/lib/utils";
import { pmConversationTitle, type PmInboxItem, type PmPerson } from "@/types/pm";

function formatWhen(date: Date): string {
  return new Date(date).toLocaleString("pt-BR");
}

function StackedAvatars({ people }: { people: PmPerson[] }) {
  const shown = people.slice(0, 3);
  return (
    <div className="flex shrink-0 -space-x-2">
      {shown.map((person, index) => {
        const name = displayUserName(person.name);
        return (
          <Avatar
            key={person.id}
            className="border-background size-10 border-2"
            style={{ zIndex: shown.length - index }}
          >
            <AvatarImage src={person.avatar || undefined} alt="" />
            <AvatarFallback className="text-xs">{userInitials(name)}</AvatarFallback>
          </Avatar>
        );
      })}
    </div>
  );
}

export function PmInboxList({
  conversations,
}: {
  conversations: PmInboxItem[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
        <h3 className="text-foreground mb-2 text-xl font-bold">
          Nenhuma conversa
        </h3>
        <p className="text-muted-foreground">
          Comece uma conversa com uma pessoa ou crie um grupo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((item) => {
        const title = pmConversationTitle(item.participants);
        const lead = item.participants[0];
        return (
          <Card
            key={item.id}
            className={cn(
              "chaos-card border-border bg-card border",
              item.unread && "border-primary/40",
            )}
          >
            <Link
              href={pmConversationPath(item.id) as never}
              className="flex items-center gap-3 p-4"
            >
              {item.isGroup ? (
                <StackedAvatars people={item.participants} />
              ) : (
                <Avatar className="size-12 shrink-0">
                  <AvatarImage src={lead?.avatar || undefined} alt="" />
                  <AvatarFallback>
                    {userInitials(displayUserName(lead?.name))}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate font-semibold">
                    {title}
                  </span>
                  {item.unread ? (
                    <span className="bg-primary size-2 shrink-0 rounded-full" />
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                  {item.lastMessagePreview || "Nova conversa"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatWhen(item.lastMessageAt)}
                </p>
              </div>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
