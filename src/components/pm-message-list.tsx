import { BBCodeContent } from "@/components/bbcode-content";
import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { cn } from "@/lib/utils";
import type { PmMessageItem } from "@/types/pm";

export function PmMessageList({ messages }: { messages: PmMessageItem[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhuma mensagem nesta conversa ainda.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card
          key={message.id}
          className={cn(
            "border-border border",
            message.mine ? "bg-muted/40" : "bg-card",
          )}
        >
          <div className="flex gap-3 p-4">
            <UserAvatarLink
              userId={message.senderId}
              name={message.senderName}
              avatar={message.senderAvatar}
              className="size-10"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <UserNameLink
                  userId={message.senderId}
                  name={message.senderName}
                  className="text-foreground font-semibold"
                />
                <span className="text-muted-foreground text-xs">
                  {new Date(message.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="mt-2">
                <BBCodeContent content={message.content} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
