"use client";

import Link from "next/link";
import { useState } from "react";

import { SubButton } from "@/components/sub-button";
import { userProfilePath } from "@/lib/app-url";

export function ProfileSubscribePanel({
  userId,
  isOwnProfile,
  initialSubscribed,
  subscriberCount,
  subscriptionCount,
}: {
  userId: string;
  isOwnProfile: boolean;
  initialSubscribed: boolean;
  subscriberCount: number;
  subscriptionCount: number;
}) {
  const [subs, setSubs] = useState(subscriberCount);
  const base = userProfilePath(userId);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {!isOwnProfile && (
        <SubButton
          targetUserId={userId}
          initialSubscribed={initialSubscribed}
          size="default"
          className="h-9 px-4 text-sm"
          onToggle={(_subscribed, subscriberCountNext) => {
            setSubs(subscriberCountNext);
          }}
        />
      )}
      <Link
        href={`${base}?tab=subscribers` as never}
        className="hover:bg-muted/60 rounded-md px-3 py-2 text-center transition-colors"
      >
        <div className="text-foreground text-lg font-bold tabular-nums leading-none">
          {subs.toLocaleString("pt-BR")}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">Subs</div>
      </Link>
      <Link
        href={`${base}?tab=subscriptions` as never}
        className="hover:bg-muted/60 rounded-md px-3 py-2 text-center transition-colors"
      >
        <div className="text-foreground text-lg font-bold tabular-nums leading-none">
          {subscriptionCount.toLocaleString("pt-BR")}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">Subscritos</div>
      </Link>
    </div>
  );
}
