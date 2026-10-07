import type { MusicSong, MusicSongSource } from "@/types/music";

/**
 * Abstração da origem de reprodução.
 * A UI/sala não deve depender de detalhes do YouTube (ou futuro provider).
 */
export interface MusicPlayerAdapter {
  readonly source: MusicSongSource;
  getEmbedUrl(song: MusicSong, startSeconds: number): string;
  canPlay(song: MusicSong): boolean;
}

export class YoutubeMusicPlayerAdapter implements MusicPlayerAdapter {
  readonly source = "youtube" as const;

  canPlay(song: MusicSong): boolean {
    return song.source === "youtube" && Boolean(song.externalId);
  }

  getEmbedUrl(song: MusicSong, startSeconds: number): string {
    const start = Math.max(0, Math.floor(startSeconds));
    const params = new URLSearchParams({
      autoplay: "1",
      start: String(start),
      enablejsapi: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    return `https://www.youtube.com/embed/${song.externalId}?${params.toString()}`;
  }
}

const adapters: Record<MusicSongSource, MusicPlayerAdapter> = {
  youtube: new YoutubeMusicPlayerAdapter(),
};

export function getMusicPlayerAdapter(source: MusicSongSource): MusicPlayerAdapter {
  return adapters[source];
}

export function getPlaybackStartSeconds(
  startedAt: string | null,
  nowMs = Date.now(),
): number {
  if (!startedAt) return 0;
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((nowMs - started) / 1000));
}
