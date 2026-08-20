"use client";

import { useState } from "react";

import { IgnoreButton } from "@/components/ignore-button";
import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { formatJoinedOn } from "@/lib/utils";
import type { IgnoredUser } from "@/types/user";

export function IgnoredUserList({ users }: { users: IgnoredUser[] }) {
  const [items, setItems] = useState(users);

  if (items.length === 0) {
    return (
      <div className="bg-muted/50 border-border rounded-lg border px-4 py-12 text-center">
        <h3 className="text-foreground mb-2 text-xl font-bold">
          Ninguém ignorado
        </h3>
        <p className="text-muted-foreground">
          Passe o mouse no avatar de alguém e clique em Ignorar. Os tópicos e as
          respostas dessa pessoa ficam ocultos até você escolher ver.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((user) => (
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
                Ignorado desde {formatJoinedOn(user.ignoredAt)}
              </p>
            </div>
            <IgnoreButton
              targetUserId={user.id}
              initialIgnored
              ignoredLabel="Designorar"
              onToggle={(ignored) => {
                if (!ignored) {
                  setItems((current) =>
                    current.filter((item) => item.id !== user.id),
                  );
                }
              }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
