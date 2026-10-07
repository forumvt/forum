"use client";

import Link from "next/link";

import { LoginDialog } from "@/components/login-dialog";
import { ConnectionBadge } from "@/components/music/connection-badge";
import { DjQueue } from "@/components/music/dj-queue";
import { MusicPlayer } from "@/components/music/music-player";
import { ReactionsBar } from "@/components/music/reactions-bar";
import { RoomChat } from "@/components/music/room-chat";
import { RoomControls } from "@/components/music/room-controls";
import { RoomUsers } from "@/components/music/room-users";
import { Button } from "@/components/ui/button";
import { useMusicRoom } from "@/hooks/use-music-room";

export function MusicRoom({ roomId }: { roomId: string }) {
  const {
    state,
    status,
    error,
    userId,
    xp,
    actionLoading,
    sendChat,
    joinQueue,
    leaveQueue,
    skipSong,
    react,
  } = useMusicRoom(roomId);

  if (!userId) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sala musical</h1>
        <p className="text-muted-foreground text-sm">
          Entre na sua conta para ouvir, conversar e tocar na fila de DJs.
        </p>
        <LoginDialog />
        <Button asChild variant="ghost" size="sm">
          <Link href={"/music" as never}>Voltar às salas</Link>
        </Button>
      </div>
    );
  }

  if ((status === "loading" || status === "connecting") && !state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <ConnectionBadge status={status} />
      </div>
    );
  }

  if (status === "error" && !state) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <ConnectionBadge status="error" />
        <p className="text-muted-foreground text-sm">{error ?? "Sala indisponível."}</p>
        <Button asChild variant="outline">
          <Link href={"/music" as never}>Voltar às salas</Link>
        </Button>
      </div>
    );
  }

  if (!state) return null;

  const viewerName =
    state.users.find((u) => u.id === userId)?.name ?? "Você";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            Subeiros Music
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {state.name}
          </h1>
          {state.description ? (
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              {state.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionBadge status={status} />
          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 px-2.5 py-1 text-xs font-medium">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            {state.onlineCount} online
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href={"/music" as never}>Salas</Link>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}

      {status === "reconnecting" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Reconectando… o estado será sincronizado automaticamente.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4 shadow-xs">
            <MusicPlayer playback={state.playback} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <ReactionsBar
                reactions={state.reactions}
                myReaction={state.myReaction}
                disabled={
                  status !== "connected" || !state.playback.currentSong
                }
                onReact={(kind) => void react(kind)}
              />
              <RoomControls
                currentUserId={userId}
                currentDj={state.playback.currentDj}
                users={state.users}
                loading={actionLoading === "skip"}
                onSkip={() => void skipSong()}
              />
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-xs lg:min-h-[280px]">
            <RoomChat
              messages={state.chat}
              disabled={status !== "connected" && status !== "reconnecting"}
              loading={actionLoading === "chat"}
              onSend={sendChat}
            />
          </div>
        </div>

        <aside className="bg-card space-y-6 rounded-xl border p-4 shadow-xs">
          <RoomUsers users={state.users} />
          <div className="border-t pt-4">
            <DjQueue
              currentDj={state.playback.currentDj}
              queue={state.djQueue}
              userId={userId}
              loading={
                actionLoading === "queue-join" ||
                actionLoading === "queue-leave"
              }
              onJoin={() => void joinQueue()}
              onLeave={() => void leaveQueue()}
            />
          </div>
        </aside>
      </div>

      <footer className="text-muted-foreground flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
        <span className="text-foreground font-medium">{viewerName}</span>
        {xp ? (
          <>
            <span aria-hidden>·</span>
            <span>Nível {xp.level}</span>
            <span aria-hidden>·</span>
            <span>{xp.totalXp} XP</span>
          </>
        ) : null}
      </footer>
    </div>
  );
}
