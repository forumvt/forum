"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function PmInboxButton() {
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pm/unread");
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount?: number };
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore polling errors
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      asChild
      aria-label={
        unreadCount > 0
          ? `Mensagens, ${unreadCount} não lidas`
          : "Mensagens privadas"
      }
    >
      <Link href={"/mensagens" as never}>
        <Mail className="size-4" />
        {unreadCount > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none">
            {unreadLabel}
          </span>
        )}
      </Link>
    </Button>
  );
}
