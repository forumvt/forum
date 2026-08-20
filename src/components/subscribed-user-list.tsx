import Link from "next/link";

import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { formatJoinedOn } from "@/lib/utils";
import type { SubscribedUser } from "@/types/user";

export function SubscribedUserList({
  users,
  emptyTitle,
  emptyDescription,
}: {
  users: SubscribedUser[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (users.length === 0) {
    return (
      <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
        <h3 className="text-foreground mb-2 text-xl font-bold">{emptyTitle}</h3>
        <p className="text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id} className="chaos-card border-border bg-card border">
          <div className="flex items-center gap-3 p-4">
            <UserAvatarLink
              userId={user.id}
              name={user.name}
              avatar={user.avatar}
              className="size-12"
            />
            <div className="min-w-0 flex-1">
              <UserNameLink
                userId={user.id}
                name={user.name}
                className="text-foreground font-semibold"
              />
              <p className="text-muted-foreground text-xs">
                Sub desde {formatJoinedOn(user.subscribedAt)}
              </p>
            </div>
            <Link
              href={`/users/${encodeURIComponent(user.id)}` as never}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Ver perfil
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
