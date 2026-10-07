import { describe, expect, it } from "vitest";

import {
  bumpPlayback,
  createEmptyRuntime,
  playbackEnded,
  pushChat,
  recomputeQueuePositions,
} from "@/lib/music/room-runtime";
import { DEMO_SONG_CATALOG } from "@/lib/music/song-catalog";

describe("music room runtime", () => {
  it("detects when playback has ended", () => {
    const state = createEmptyRuntime("room-1");
    const song = DEMO_SONG_CATALOG[0]!;
    const dj = {
      id: "u1",
      name: "Adriano",
      avatar: null,
      role: "USER" as const,
      joinedAt: new Date().toISOString(),
      isDj: true,
      queuePosition: null,
      isModerator: false,
    };
    bumpPlayback(state, song, dj);
    state.playback.startedAt = new Date(Date.now() - (song.duration + 5) * 1000).toISOString();
    expect(playbackEnded(state)).toBe(true);
  });

  it("keeps chat capped and updates queue positions", () => {
    const state = createEmptyRuntime("room-1");
    state.users = [
      {
        id: "u1",
        name: "A",
        avatar: null,
        role: "USER",
        joinedAt: new Date().toISOString(),
        isDj: false,
        queuePosition: null,
        isModerator: false,
      },
      {
        id: "u2",
        name: "B",
        avatar: null,
        role: "USER",
        joinedAt: new Date().toISOString(),
        isDj: false,
        queuePosition: null,
        isModerator: false,
      },
    ];
    state.djQueue = [
      {
        userId: "u2",
        name: "B",
        avatar: null,
        joinedAt: new Date().toISOString(),
      },
    ];
    recomputeQueuePositions(state);
    expect(state.users.find((u) => u.id === "u2")?.queuePosition).toBe(1);

    for (let i = 0; i < 100; i++) {
      pushChat(state, {
        id: String(i),
        userId: "u1",
        username: "A",
        avatar: null,
        message: `msg ${i}`,
        createdAt: new Date().toISOString(),
      });
    }
    expect(state.chat.length).toBeLessThanOrEqual(80);
  });
});
