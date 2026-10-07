import { withRedis } from "@/lib/redis";
import type {
  DjQueueItem,
  MusicChatMessage,
  MusicReactionCounts,
  MusicReactionKind,
  MusicRoomPlayback,
  MusicRoomUser,
  MusicSong,
} from "@/types/music";

const PRESENCE_TTL_SECONDS = 45;
const CHAT_LIMIT = 80;
const STATE_TTL_SECONDS = 60 * 60 * 24;

export interface RuntimeRoomState {
  roomId: string;
  version: number;
  playback: MusicRoomPlayback;
  users: MusicRoomUser[];
  djQueue: DjQueueItem[];
  chat: MusicChatMessage[];
  reactions: MusicReactionCounts;
  /** userId -> reaction kind for current song */
  reactionByUser: Record<string, MusicReactionKind>;
  updatedAt: string;
}

function emptyReactions(): MusicReactionCounts {
  return { heart: 0, fire: 0, laugh: 0, skull: 0 };
}

export function createEmptyRuntime(roomId: string): RuntimeRoomState {
  return {
    roomId,
    version: 1,
    playback: {
      currentSong: null,
      currentDj: null,
      startedAt: null,
      duration: 0,
    },
    users: [],
    djQueue: [],
    chat: [],
    reactions: emptyReactions(),
    reactionByUser: {},
    updatedAt: new Date().toISOString(),
  };
}

type MemoryStore = Map<string, RuntimeRoomState>;

const globalStore = globalThis as unknown as {
  forumvtMusicRuntime?: MemoryStore;
};

function memory(): MemoryStore {
  return (globalStore.forumvtMusicRuntime ??= new Map());
}

function stateKey(roomId: string): string {
  return `music:room:${roomId}:state`;
}

function presenceKey(roomId: string, userId: string): string {
  return `music:room:${roomId}:presence:${userId}`;
}

function presencePattern(roomId: string): string {
  return `music:room:${roomId}:presence:*`;
}

export async function loadRuntime(roomId: string): Promise<RuntimeRoomState> {
  const fromRedis = await withRedis(null as RuntimeRoomState | null, async (redis) => {
    const raw = await redis.get<RuntimeRoomState>(stateKey(roomId));
    return raw ?? null;
  });

  if (fromRedis) return fromRedis;

  const local = memory().get(roomId);
  if (local) return local;

  const empty = createEmptyRuntime(roomId);
  memory().set(roomId, empty);
  return empty;
}

export async function saveRuntime(state: RuntimeRoomState): Promise<void> {
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  memory().set(state.roomId, next);

  await withRedis(undefined, async (redis) => {
    await redis.set(stateKey(state.roomId), next, { ex: STATE_TTL_SECONDS });
  });
}

export async function mutateRuntime(
  roomId: string,
  mutator: (state: RuntimeRoomState) => RuntimeRoomState | void,
  options?: { bumpOnlyIfChanged?: boolean },
): Promise<RuntimeRoomState> {
  const current = await loadRuntime(roomId);
  const draft: RuntimeRoomState = structuredClone(current);
  const result = mutator(draft) ?? draft;

  if (options?.bumpOnlyIfChanged) {
    const before = JSON.stringify({
      users: current.users.map((u) => u.id),
      queue: current.djQueue.map((q) => q.userId),
      dj: current.playback.currentDj?.id ?? null,
      song: current.playback.currentSong?.id ?? null,
      startedAt: current.playback.startedAt,
      chatLen: current.chat.length,
      reactions: current.reactions,
    });
    const after = JSON.stringify({
      users: result.users.map((u) => u.id),
      queue: result.djQueue.map((q) => q.userId),
      dj: result.playback.currentDj?.id ?? null,
      song: result.playback.currentSong?.id ?? null,
      startedAt: result.playback.startedAt,
      chatLen: result.chat.length,
      reactions: result.reactions,
    });
    if (before === after) return current;
  }

  result.version = current.version + 1;
  result.updatedAt = new Date().toISOString();
  await saveRuntime(result);
  return result;
}

export async function touchPresence(
  roomId: string,
  userId: string,
): Promise<void> {
  await withRedis(undefined, async (redis) => {
    await redis.set(presenceKey(roomId, userId), "1", {
      ex: PRESENCE_TTL_SECONDS,
    });
  });

  // Fallback local: marca joinedAt recente no user entry via TTL simulado em updatedAt
  const state = memory().get(roomId);
  if (state) {
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      (user as MusicRoomUser & { lastSeenAt?: string }).lastSeenAt =
        new Date().toISOString();
    }
  }
}

export async function clearPresence(
  roomId: string,
  userId: string,
): Promise<void> {
  await withRedis(undefined, async (redis) => {
    await redis.del(presenceKey(roomId, userId));
  });
}

export async function listActivePresenceUserIds(
  roomId: string,
): Promise<string[] | null> {
  return withRedis(null as string[] | null, async (redis) => {
    const keys = await redis.keys(presencePattern(roomId));
    return keys.map((key) => key.split(":").pop()!).filter(Boolean);
  });
}

export function bumpPlayback(
  state: RuntimeRoomState,
  song: MusicSong,
  dj: MusicRoomUser,
): void {
  state.playback = {
    currentSong: song,
    currentDj: { ...dj, isDj: true, queuePosition: null },
    startedAt: new Date().toISOString(),
    duration: song.duration,
  };
  state.reactions = emptyReactions();
  state.reactionByUser = {};
  state.users = state.users.map((user) => ({
    ...user,
    isDj: user.id === dj.id,
    queuePosition:
      state.djQueue.findIndex((item) => item.userId === user.id) >= 0
        ? state.djQueue.findIndex((item) => item.userId === user.id) + 1
        : null,
  }));
}

export function clearPlayback(state: RuntimeRoomState): void {
  state.playback = {
    currentSong: null,
    currentDj: null,
    startedAt: null,
    duration: 0,
  };
  state.reactions = emptyReactions();
  state.reactionByUser = {};
  state.users = state.users.map((user) => ({ ...user, isDj: false }));
}

export function pushChat(
  state: RuntimeRoomState,
  message: MusicChatMessage,
): void {
  state.chat = [...state.chat, message].slice(-CHAT_LIMIT);
}

export function recomputeQueuePositions(state: RuntimeRoomState): void {
  const queueIndex = new Map(
    state.djQueue.map((item, index) => [item.userId, index + 1]),
  );
  const djId = state.playback.currentDj?.id ?? null;
  state.users = state.users.map((user) => ({
    ...user,
    isDj: user.id === djId,
    queuePosition: queueIndex.get(user.id) ?? null,
  }));
}

export function playbackEnded(state: RuntimeRoomState, now = Date.now()): boolean {
  const { startedAt, duration, currentSong } = state.playback;
  if (!currentSong || !startedAt || duration <= 0) return false;
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return false;
  return now >= started + duration * 1000;
}
