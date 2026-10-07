"use client";

import { Headphones, Music2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getMusicPlayerAdapter,
  getPlaybackStartSeconds,
} from "@/lib/music/player-adapter";
import type { MusicRoomPlayback } from "@/types/music";

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function MusicPlayer({ playback }: { playback: MusicRoomPlayback }) {
  const song = playback.currentSong;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const position = useMemo(
    () => Math.min(playback.duration, getPlaybackStartSeconds(playback.startedAt, now)),
    [now, playback.duration, playback.startedAt],
  );

  const progress =
    playback.duration > 0 ? Math.min(100, (position / playback.duration) * 100) : 0;

  const playbackSessionKey = song
    ? `${song.id}:${playback.startedAt ?? ""}:${song.externalId}`
    : null;

  const embedUrl = useMemo(() => {
    if (!song || !playbackSessionKey) return null;
    const adapter = getMusicPlayerAdapter(song.source);
    if (!adapter.canPlay(song)) return null;
    const startAt = getPlaybackStartSeconds(playback.startedAt);
    return adapter.getEmbedUrl(song, startAt);
    // Intencional: só recria embed quando a sessão de faixa muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackSessionKey]);

  if (!song) {
    return (
      <div className="border-border/80 bg-muted/30 flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <Music2 className="text-muted-foreground size-10 opacity-60" />
        <div>
          <p className="font-medium">Nada tocando</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Entre na fila de DJs para começar uma faixa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-sm">
        {embedUrl ? (
          <iframe
            key={`${song.id}-${playback.startedAt}`}
            title={`${song.artist} — ${song.title}`}
            src={embedUrl}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
            Fonte de áudio indisponível
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={song.thumbnail}
            alt=""
            className="size-14 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tracking-tight">
              {song.title}
            </p>
            <p className="text-muted-foreground truncate text-sm">{song.artist}</p>
            {playback.currentDj ? (
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <Headphones className="size-3.5" />
                DJ: <span className="text-foreground font-medium">{playback.currentDj.name}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
            <span>{formatTime(position)}</span>
            <span>{formatTime(playback.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
