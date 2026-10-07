"use client";

import { Headphones, Music2, Plus, Radio } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { LoginDialog } from "@/components/login-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import type { MusicRoomListItem } from "@/types/music";

export function MusicRoomList() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<MusicRoomListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      const res = await fetch("/api/music/rooms");
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { rooms: MusicRoomListItem[] };
      setRooms(data.rooms);
      setError(null);
    } catch {
      setError("Não foi possível carregar as salas.");
      setRooms([]);
    }
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, []);

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    startTransition(async () => {
      const res = await fetch("/api/music/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Falha ao criar sala.");
        return;
      }
      const data = (await res.json()) as { roomId: string };
      router.push(`/music/${data.roomId}` as never);
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Radio className="text-primary size-7" />
            <h1 className="text-3xl font-bold tracking-tight">Music</h1>
          </div>
          <p className="text-muted-foreground text-base">
            Salas musicais ao vivo — ouça, converse e seja o DJ.
          </p>
        </div>
        {session?.user ? (
          <Button
            type="button"
            variant={creating ? "secondary" : "default"}
            onClick={() => setCreating((v) => !v)}
          >
            <Plus className="size-4" />
            {creating ? "Cancelar" : "Criar sala"}
          </Button>
        ) : (
          <LoginDialog triggerLabel="Entrar para criar" triggerVariant="default" />
        )}
      </header>

      {creating && session?.user ? (
        <form
          onSubmit={handleCreate}
          className="bg-card mb-8 space-y-3 rounded-xl border p-4 shadow-xs"
        >
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="room-name">
              Nome da sala
            </label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Subeiros FM"
              minLength={3}
              maxLength={60}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="room-desc"
            >
              Descrição (opcional)
            </label>
            <Input
              id="room-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que rola nessa sala?"
              maxLength={200}
            />
          </div>
          <Button type="submit" disabled={pending || name.trim().length < 3}>
            {pending ? "Criando…" : "Criar e entrar"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="text-destructive mb-4 text-sm">{error}</p>
      ) : null}

      {rooms === null ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          Carregando salas…
        </div>
      ) : rooms.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Music2 className="text-muted-foreground size-10 opacity-50" />
          <p className="font-medium">Nenhuma sala disponível</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Crie a primeira sala musical do fórum e chame a galera.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="bg-card hover:border-primary/40 group flex flex-col gap-4 rounded-xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold">{room.name}</h2>
                  <span
                    className={
                      room.status === "live"
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
                    }
                  >
                    {room.status === "live" ? "AO VIVO" : "Ociosa"}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {room.onlineCount}{" "}
                  {room.onlineCount === 1 ? "ouvinte" : "ouvintes"}
                  {room.currentDjName ? (
                    <>
                      {" "}
                      · <Headphones className="inline size-3.5" />{" "}
                      {room.currentDjName}
                    </>
                  ) : null}
                </p>
                <p className="truncate text-sm">
                  {room.currentSongTitle && room.currentSongArtist
                    ? `${room.currentSongArtist} — ${room.currentSongTitle}`
                    : "Nenhuma música no momento"}
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/music/${room.id}` as never}>Entrar</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
