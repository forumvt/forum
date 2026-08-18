"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  NotificationItem,
  NotificationsPayload,
  NotificationType,
} from "@/types/notification";

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function actionLabel(type: NotificationType): string {
  switch (type) {
    case "own_thread":
      return "respondeu no seu tópico";
    case "viewed_thread":
      return "respondeu em";
    case "reply":
      return "respondeu você em";
    case "like":
      return "curtiu sua mensagem em";
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "?";
}

const emptyPayload: NotificationsPayload = {
  unreadCount: 0,
  notifications: [],
};

export function NotificationBell() {
  const [payload, setPayload] = useState<NotificationsPayload>(emptyPayload);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsPayload;
      setPayload({
        unreadCount: data.unreadCount ?? 0,
        notifications: data.notifications ?? [],
      });
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

  async function markOne(id: string) {
    setPayload((current) => ({
      unreadCount: Math.max(
        0,
        current.unreadCount -
          (current.notifications.find((item) => item.id === id)?.readAt
            ? 0
            : 1),
      ),
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAll() {
    setPayload((current) => ({
      unreadCount: 0,
      notifications: current.notifications.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  const unreadLabel =
    payload.unreadCount > 99 ? "99+" : String(payload.unreadCount);

  return (
    <DropdownMenu onOpenChange={(open) => open && void load()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            payload.unreadCount > 0
              ? `Alertas, ${payload.unreadCount} não lidos`
              : "Alertas"
          }
        >
          <Bell className="size-4" />
          {payload.unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none">
              {unreadLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Alertas</DropdownMenuLabel>
          {payload.unreadCount > 0 && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => void markAll()}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {payload.notifications.length === 0 ? (
          <p className="text-muted-foreground px-3 py-8 text-center text-sm">
            Nenhum alerta ainda.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto py-1">
            {payload.notifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onOpen={() => void markOne(item.id)}
              />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: () => void;
}) {
  const unread = !item.readAt;

  return (
    <DropdownMenuItem asChild className="p-0">
      <Link
        href={`/threads/${item.threadSlug}` as never}
        onClick={onOpen}
        className={`flex items-start gap-2 px-3 py-2 ${unread ? "bg-muted/60" : ""}`}
      >
        <Avatar className="mt-0.5 size-8 shrink-0">
          <AvatarImage src={item.actorAvatar || undefined} alt="" />
          <AvatarFallback className="text-xs">
            {initialsOf(item.actorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{item.actorName}</span>{" "}
            {actionLabel(item.type)}{" "}
            <span className="font-medium">{item.threadTitle}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
        {unread && (
          <span
            className="bg-primary mt-1.5 size-2 shrink-0 rounded-full"
            aria-hidden
          />
        )}
      </Link>
    </DropdownMenuItem>
  );
}
