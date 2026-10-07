"use client";

import { Headphones } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { DjQueueItem, MusicRoomUser } from "@/types/music";

export function DjQueue({
  currentDj,
  queue,
  userId,
  loading,
  onJoin,
  onLeave,
}: {
  currentDj: MusicRoomUser | null;
  queue: DjQueueItem[];
  userId: string | null;
  loading?: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const inQueue = Boolean(userId && queue.some((item) => item.userId === userId));
  const isDj = Boolean(userId && currentDj?.id === userId);

  return (
    <section className="space-y-3">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Fila de DJs
      </h2>

      <div className="bg-muted/40 rounded-lg border p-3">
        <p className="text-muted-foreground mb-1 text-[11px] uppercase">DJ atual</p>
        {currentDj ? (
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={currentDj.avatar ?? undefined} alt="" />
              <AvatarFallback>{currentDj.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{currentDj.name}</p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Headphones className="size-3" /> no comando
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nenhum DJ — a sala está ociosa.</p>
        )}
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-[11px] uppercase">Próximos</p>
        {queue.length === 0 ? (
          <p className="text-muted-foreground text-sm">Fila vazia.</p>
        ) : (
          <ol className="space-y-2">
            {queue.map((item, index) => (
              <li key={item.userId} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-4 tabular-nums">
                  {index + 1}.
                </span>
                <Avatar className="size-6">
                  <AvatarImage src={item.avatar ?? undefined} alt="" />
                  <AvatarFallback>{item.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{item.name}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {userId ? (
        <div className="pt-1">
          {isDj ? (
            <p className="text-muted-foreground text-xs">
              Você é o DJ atual. Use pular para avançar a faixa.
            </p>
          ) : inQueue ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={onLeave}
              className="w-full"
            >
              Sair da fila
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={onJoin}
              className="w-full"
            >
              Entrar na fila
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
