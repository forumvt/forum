"use client";

import { Headphones, Shield } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MusicRoomUser } from "@/types/music";

export function RoomUsers({ users }: { users: MusicRoomUser[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Ouvintes · {users.length}
      </h2>
      {users.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ninguém na sala ainda.</p>
      ) : (
        <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
          {users.map((user) => (
            <li key={user.id} className="flex items-center gap-2.5">
              <span className="relative">
                <Avatar className="size-7">
                  <AvatarImage src={user.avatar ?? undefined} alt="" />
                  <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="border-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 bg-emerald-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.name}
                  {user.isDj ? (
                    <Headphones className="ml-1 inline size-3.5 text-amber-500" />
                  ) : null}
                  {user.isModerator ? (
                    <Shield className="text-muted-foreground ml-1 inline size-3.5" />
                  ) : null}
                </p>
                {user.queuePosition ? (
                  <p className="text-muted-foreground text-[11px]">
                    Fila #{user.queuePosition}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
