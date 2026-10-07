import { randomUUID } from "crypto";

import { isStaffUser } from "@/lib/abuse-guard";
import { assertCooldown } from "@/lib/anti-flood";
import { levelFromXp } from "@/lib/games/level";
import { awardMusicXp } from "@/lib/music/gamification";
import {
  bumpPlayback,
  clearPlayback,
  clearPresence,
  listActivePresenceUserIds,
  loadRuntime,
  mutateRuntime,
  playbackEnded,
  pushChat,
  recomputeQueuePositions,
  type RuntimeRoomState,
  touchPresence,
} from "@/lib/music/room-runtime";
import { pickRandomSong } from "@/lib/music/song-catalog";
import { isStaff, toUserRole } from "@/lib/permissions";
import { checkRateLimit, type WriteAbuseError } from "@/lib/rate-limit";
import * as musicRoomRepo from "@/repositories/music-room.repository";
import * as userRepo from "@/repositories/user.repository";
import type {
  MusicChatMessage,
  MusicReactionKind,
  MusicRoomListItem,
  MusicRoomState,
  MusicRoomUser,
} from "@/types/music";
import {
  MUSIC_CHAT_MAX_LENGTH,
  MUSIC_REACTION_KINDS,
  MUSIC_ROOM_DESC_MAX,
  MUSIC_ROOM_NAME_MAX,
} from "@/types/music";

export type MusicRoomError =
  | "unauthorized"
  | "banned"
  | "not_found"
  | "forbidden"
  | "invalid"
  | "already_in_queue"
  | "already_dj"
  | "not_in_queue"
  | "not_dj"
  | "duplicate_reaction"
  | WriteAbuseError;

type Ok<T> = { ok: true } & T;
type Err = {
  ok: false;
  error: MusicRoomError;
  reason?: string | null;
  retryAfterSeconds?: number;
};

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function ensureDefaultRoom(): Promise<void> {
  const rooms = await musicRoomRepo.listActiveRooms();
  if (rooms.length > 0) return;

  const { db } = await import("@/db");
  const { userTable } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const [admin] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.role, "ADMINISTRATOR"))
    .limit(1);
  const [anyUser] = admin
    ? [admin]
    : await db.select({ id: userTable.id }).from(userTable).limit(1);

  const creatorId = anyUser?.id;
  if (!creatorId) return;

  const existing = await musicRoomRepo.findBySlug("subeiros-fm");
  if (existing) return;

  await musicRoomRepo.createRoom({
    name: "Subeiros FM",
    slug: "subeiros-fm",
    description:
      "Sala musical social do fórum — entre, converse e toque suas faixas.",
    createdByUserId: creatorId,
  });
}

function toPublicUser(
  user: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  },
  joinedAt: string,
  extras: { isDj: boolean; queuePosition: number | null },
): MusicRoomUser {
  const role = toUserRole(user.role);
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    role,
    joinedAt,
    isDj: extras.isDj,
    queuePosition: extras.queuePosition,
    isModerator: isStaff(role),
  };
}

function toClientState(
  room: { id: string; name: string; description: string | null },
  runtime: RuntimeRoomState,
  viewerId?: string | null,
): MusicRoomState {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    version: runtime.version,
    playback: runtime.playback,
    users: runtime.users,
    djQueue: runtime.djQueue,
    chat: runtime.chat,
    reactions: runtime.reactions,
    myReaction: viewerId ? (runtime.reactionByUser[viewerId] ?? null) : null,
    onlineCount: runtime.users.length,
  };
}

async function assertNotBanned(
  userId: string,
): Promise<Err | null> {
  const user = await userRepo.findPublicById(userId);
  if (!user) return { ok: false, error: "unauthorized" };
  if (user.bannedAt) {
    return { ok: false, error: "banned", reason: user.banReason };
  }
  return null;
}

async function advanceIfNeeded(roomId: string): Promise<RuntimeRoomState> {
  const current = await loadRuntime(roomId);
  if (!playbackEnded(current)) return current;

  return mutateRuntime(roomId, (state) => {
    if (!playbackEnded(state)) return;

    const finished = state.playback;
    if (finished.currentSong) {
      void musicRoomRepo.insertHistory({
        roomId,
        songId: finished.currentSong.id,
        title: finished.currentSong.title,
        artist: finished.currentSong.artist,
        source: finished.currentSong.source,
        duration: finished.currentSong.duration,
        djUserId: finished.currentDj?.id ?? null,
      });
    }

    const nextFromQueue = state.djQueue.shift();
    if (nextFromQueue) {
      const user =
        state.users.find((u) => u.id === nextFromQueue.userId) ??
        ({
          id: nextFromQueue.userId,
          name: nextFromQueue.name,
          avatar: nextFromQueue.avatar,
          role: "USER" as const,
          joinedAt: nextFromQueue.joinedAt,
          isDj: true,
          queuePosition: null,
          isModerator: false,
        } satisfies MusicRoomUser);

      const song = pickRandomSong(finished.currentSong?.id);
      bumpPlayback(state, song, user);
      recomputeQueuePositions(state);
      void awardMusicXp(user.id, "music_dj_song");
      return;
    }

    if (finished.currentDj) {
      const song = pickRandomSong(finished.currentSong?.id);
      bumpPlayback(state, song, finished.currentDj);
      recomputeQueuePositions(state);
      return;
    }

    clearPlayback(state);
    recomputeQueuePositions(state);
  });
}

function pruneStaleUsers(
  state: RuntimeRoomState,
  activeIds: string[] | null,
): void {
  if (!activeIds) {
    // Sem Redis: remove usuários sem heartbeat recente (>60s)
    const now = Date.now();
    const before = state.users.length;
    state.users = state.users.filter((user) => {
      const lastSeen =
        (user as MusicRoomUser & { lastSeenAt?: string }).lastSeenAt ??
        user.joinedAt;
      return now - Date.parse(lastSeen) < 60_000;
    });
    if (state.users.length === before) return;

    const alive = new Set(state.users.map((u) => u.id));
    state.djQueue = state.djQueue.filter((item) => alive.has(item.userId));
    if (
      state.playback.currentDj &&
      !alive.has(state.playback.currentDj.id)
    ) {
      const next = state.djQueue.shift();
      if (next) {
        const user = state.users.find((u) => u.id === next.userId);
        if (user) {
          bumpPlayback(
            state,
            pickRandomSong(state.playback.currentSong?.id),
            user,
          );
        } else {
          clearPlayback(state);
        }
      } else {
        clearPlayback(state);
      }
    }
    recomputeQueuePositions(state);
    return;
  }

  const active = new Set(activeIds);
  const leaving = state.users.filter((u) => !active.has(u.id));
  if (leaving.length === 0) return;

  state.users = state.users.filter((u) => active.has(u.id));
  state.djQueue = state.djQueue.filter((item) => active.has(item.userId));

  if (
    state.playback.currentDj &&
    !active.has(state.playback.currentDj.id)
  ) {
    // DJ caiu: avança
    const next = state.djQueue.shift();
    if (next) {
      const user = state.users.find((u) => u.id === next.userId);
      if (user) {
        bumpPlayback(state, pickRandomSong(state.playback.currentSong?.id), user);
      } else {
        clearPlayback(state);
      }
    } else {
      clearPlayback(state);
    }
  }
  recomputeQueuePositions(state);
}

export async function listRooms(): Promise<MusicRoomListItem[]> {
  await ensureDefaultRoom();
  const rooms = await musicRoomRepo.listActiveRooms();
  const items: MusicRoomListItem[] = [];

  for (const room of rooms) {
    if (room.isPrivate) continue;
    const runtime = await advanceIfNeeded(room.id);
    items.push({
      id: room.id,
      name: room.name,
      description: room.description,
      onlineCount: runtime.users.length,
      currentDjName: runtime.playback.currentDj?.name ?? null,
      currentSongTitle: runtime.playback.currentSong?.title ?? null,
      currentSongArtist: runtime.playback.currentSong?.artist ?? null,
      status: runtime.playback.currentSong ? "live" : "idle",
    });
  }

  return items;
}

export async function createRoom(
  userId: string,
  input: { name: string; description?: string },
): Promise<Ok<{ roomId: string }> | Err> {
  const ban = await assertNotBanned(userId);
  if (ban) return ban;

  const name = input.name.trim();
  if (name.length < 3 || name.length > MUSIC_ROOM_NAME_MAX) {
    return { ok: false, error: "invalid" };
  }
  const description = input.description?.trim() || null;
  if (description && description.length > MUSIC_ROOM_DESC_MAX) {
    return { ok: false, error: "invalid" };
  }

  if (!(await isStaffUser(userId))) {
    const rate = await checkRateLimit("musicRoomCreate", userId);
    if (!rate.ok) {
      return {
        ok: false,
        error: rate.error,
        retryAfterSeconds: rate.retryAfterSeconds,
      };
    }
    const count = await musicRoomRepo.countRoomsByCreator(userId);
    if (count >= 3) return { ok: false, error: "forbidden" };
  }

  let slug = slugify(name) || `sala-${randomUUID().slice(0, 8)}`;
  if (await musicRoomRepo.findBySlug(slug)) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const room = await musicRoomRepo.createRoom({
    name,
    slug,
    description,
    createdByUserId: userId,
  });

  return { ok: true, roomId: room.id };
}

export async function getRoomState(
  roomId: string,
  viewerId?: string | null,
): Promise<Ok<{ state: MusicRoomState }> | Err> {
  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };
  if (room.isPrivate && !viewerId) return { ok: false, error: "forbidden" };

  let runtime = await advanceIfNeeded(roomId);
  const activeIds = await listActivePresenceUserIds(roomId);
  runtime = await mutateRuntime(
    roomId,
    (state) => {
      pruneStaleUsers(state, activeIds);
    },
    { bumpOnlyIfChanged: true },
  );

  return { ok: true, state: toClientState(room, runtime, viewerId) };
}

export async function joinRoom(
  roomId: string,
  userId: string,
): Promise<Ok<{ state: MusicRoomState; xp: { totalXp: number; level: number } }> | Err> {
  const ban = await assertNotBanned(userId);
  if (ban) return ban;

  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  const profile = await userRepo.findPublicById(userId);
  if (!profile) return { ok: false, error: "unauthorized" };

  await touchPresence(roomId, userId);

  const runtime = await mutateRuntime(roomId, (state) => {
    pruneStaleUsers(state, null);
    const nowIso = new Date().toISOString();
    const existing = state.users.find((u) => u.id === userId);
    if (existing) {
      (existing as MusicRoomUser & { lastSeenAt?: string }).lastSeenAt = nowIso;
      return;
    }

    const queuePosition =
      state.djQueue.findIndex((item) => item.userId === userId) + 1 || null;
    const joined = toPublicUser(
      {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
      },
      nowIso,
      {
        isDj: state.playback.currentDj?.id === userId,
        queuePosition: queuePosition === 0 ? null : queuePosition,
      },
    );
    (joined as MusicRoomUser & { lastSeenAt?: string }).lastSeenAt = nowIso;
    state.users.push(joined);
    recomputeQueuePositions(state);
  });

  const advanced = await advanceIfNeeded(roomId);
  const xp = await getViewerXp(userId);
  return {
    ok: true,
    state: toClientState(
      room,
      advanced.version >= runtime.version ? advanced : runtime,
      userId,
    ),
    xp,
  };
}

export async function leaveRoom(
  roomId: string,
  userId: string,
): Promise<Ok<{ state: MusicRoomState }> | Err> {
  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  await clearPresence(roomId, userId);

  const runtime = await mutateRuntime(roomId, (state) => {
    state.users = state.users.filter((u) => u.id !== userId);
    state.djQueue = state.djQueue.filter((item) => item.userId !== userId);

    if (state.playback.currentDj?.id === userId) {
      const next = state.djQueue.shift();
      if (next) {
        const user = state.users.find((u) => u.id === next.userId);
        if (user) {
          bumpPlayback(
            state,
            pickRandomSong(state.playback.currentSong?.id),
            user,
          );
          void awardMusicXp(user.id, "music_dj_song");
        } else {
          clearPlayback(state);
        }
      } else {
        clearPlayback(state);
      }
    }
    recomputeQueuePositions(state);
  });

  return { ok: true, state: toClientState(room, runtime, userId) };
}

export async function heartbeat(
  roomId: string,
  userId: string,
): Promise<Ok<{ state: MusicRoomState; xp: { totalXp: number; level: number } }> | Err> {
  const joined = await joinRoom(roomId, userId);
  if (!joined.ok) return joined;
  await touchPresence(roomId, userId);
  return joined;
}

export async function joinQueue(
  roomId: string,
  userId: string,
): Promise<Ok<{ state: MusicRoomState }> | Err> {
  const ban = await assertNotBanned(userId);
  if (ban) return ban;

  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  const profile = await userRepo.findPublicById(userId);
  if (!profile) return { ok: false, error: "unauthorized" };

  const before = await loadRuntime(roomId);
  if (before.playback.currentDj?.id === userId) {
    return { ok: false, error: "already_dj" };
  }
  if (before.djQueue.some((item) => item.userId === userId)) {
    return { ok: false, error: "already_in_queue" };
  }

  let becameFirstDj = false;

  const runtime = await mutateRuntime(roomId, (state) => {
    if (!state.users.some((u) => u.id === userId)) {
      state.users.push(
        toPublicUser(
          {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
          },
          new Date().toISOString(),
          { isDj: false, queuePosition: null },
        ),
      );
    }

    if (state.playback.currentDj?.id === userId) return;
    if (state.djQueue.some((item) => item.userId === userId)) return;

    if (!state.playback.currentDj) {
      const user = state.users.find((u) => u.id === userId)!;
      bumpPlayback(state, pickRandomSong(), user);
      becameFirstDj = true;
      recomputeQueuePositions(state);
      return;
    }

    state.djQueue.push({
      userId,
      name: profile.name,
      avatar: profile.avatar,
      joinedAt: new Date().toISOString(),
    });
    recomputeQueuePositions(state);
  });

  if (becameFirstDj) {
    await awardMusicXp(userId, "music_first_dj");
    await awardMusicXp(userId, "music_dj_song");
  } else if (runtime.djQueue.some((item) => item.userId === userId)) {
    await awardMusicXp(userId, "music_queue_join");
  }

  return { ok: true, state: toClientState(room, runtime, userId) };
}

export async function leaveQueue(
  roomId: string,
  userId: string,
): Promise<Ok<{ state: MusicRoomState }> | Err> {
  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  const before = await loadRuntime(roomId);
  if (!before.djQueue.some((item) => item.userId === userId)) {
    return { ok: false, error: "not_in_queue" };
  }

  const runtime = await mutateRuntime(roomId, (state) => {
    state.djQueue = state.djQueue.filter((item) => item.userId !== userId);
    recomputeQueuePositions(state);
  });

  return { ok: true, state: toClientState(room, runtime, userId) };
}

export async function skipSong(
  roomId: string,
  userId: string,
): Promise<Ok<{ state: MusicRoomState }> | Err> {
  const ban = await assertNotBanned(userId);
  if (ban) return ban;

  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  const runtimeBefore = await loadRuntime(roomId);
  const isDj = runtimeBefore.playback.currentDj?.id === userId;
  const moderator = await isStaffUser(userId);
  if (!isDj && !moderator) return { ok: false, error: "forbidden" };

  const runtime = await mutateRuntime(roomId, (state) => {
    const finished = state.playback;
    if (finished.currentSong) {
      void musicRoomRepo.insertHistory({
        roomId,
        songId: finished.currentSong.id,
        title: finished.currentSong.title,
        artist: finished.currentSong.artist,
        source: finished.currentSong.source,
        duration: finished.currentSong.duration,
        djUserId: finished.currentDj?.id ?? null,
      });
    }

    const next = state.djQueue.shift();
    if (next) {
      const user = state.users.find((u) => u.id === next.userId);
      if (user) {
        bumpPlayback(
          state,
          pickRandomSong(finished.currentSong?.id),
          user,
        );
        void awardMusicXp(user.id, "music_dj_song");
      } else {
        clearPlayback(state);
      }
    } else if (finished.currentDj && isDj) {
      // DJ pula a própria faixa e continua
      bumpPlayback(
        state,
        pickRandomSong(finished.currentSong?.id),
        finished.currentDj,
      );
      void awardMusicXp(finished.currentDj.id, "music_dj_song");
    } else if (finished.currentDj && moderator) {
      bumpPlayback(
        state,
        pickRandomSong(finished.currentSong?.id),
        finished.currentDj,
      );
    } else {
      clearPlayback(state);
    }
    recomputeQueuePositions(state);
  });

  return { ok: true, state: toClientState(room, runtime, userId) };
}

export async function sendChat(
  roomId: string,
  userId: string,
  message: string,
): Promise<Ok<{ state: MusicRoomState; chat: MusicChatMessage }> | Err> {
  const ban = await assertNotBanned(userId);
  if (ban) return ban;

  const text = message.trim();
  if (!text || text.length > MUSIC_CHAT_MAX_LENGTH) {
    return { ok: false, error: "invalid" };
  }

  if (!(await isStaffUser(userId))) {
    const rate = await checkRateLimit("musicChat", userId);
    if (!rate.ok) {
      return {
        ok: false,
        error: rate.error,
        retryAfterSeconds: rate.retryAfterSeconds,
      };
    }
    const flood = await assertCooldown("musicChat", userId);
    if (!flood.ok) {
      return {
        ok: false,
        error: flood.error,
        retryAfterSeconds: flood.retryAfterSeconds,
      };
    }
  }

  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  const profile = await userRepo.findPublicById(userId);
  if (!profile) return { ok: false, error: "unauthorized" };

  const chat: MusicChatMessage = {
    id: randomUUID(),
    userId,
    username: profile.name,
    avatar: profile.avatar,
    message: text,
    createdAt: new Date().toISOString(),
  };

  const runtime = await mutateRuntime(roomId, (state) => {
    if (!state.users.some((u) => u.id === userId)) {
      state.users.push(
        toPublicUser(
          {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
          },
          new Date().toISOString(),
          {
            isDj: state.playback.currentDj?.id === userId,
            queuePosition: null,
          },
        ),
      );
    }
    pushChat(state, chat);
  });

  void awardMusicXp(userId, "music_chat");

  return {
    ok: true,
    state: toClientState(room, runtime, userId),
    chat,
  };
}

export async function addReaction(
  roomId: string,
  userId: string,
  kind: MusicReactionKind,
): Promise<Ok<{ state: MusicRoomState }> | Err> {
  const ban = await assertNotBanned(userId);
  if (ban) return ban;

  if (!MUSIC_REACTION_KINDS.includes(kind)) {
    return { ok: false, error: "invalid" };
  }

  if (!(await isStaffUser(userId))) {
    const rate = await checkRateLimit("musicReaction", userId);
    if (!rate.ok) {
      return {
        ok: false,
        error: rate.error,
        retryAfterSeconds: rate.retryAfterSeconds,
      };
    }
  }

  const room = await musicRoomRepo.findById(roomId);
  if (!room || !room.isActive) return { ok: false, error: "not_found" };

  const before = await loadRuntime(roomId);
  if (!before.playback.currentSong) return { ok: false, error: "invalid" };
  if (before.reactionByUser[userId]) {
    return { ok: false, error: "duplicate_reaction" };
  }

  const runtime = await mutateRuntime(roomId, (state) => {
    if (!state.playback.currentSong) return;
    if (state.reactionByUser[userId]) return;
    state.reactionByUser[userId] = kind;
    state.reactions[kind] += 1;
  });

  void awardMusicXp(userId, "music_reaction");

  return { ok: true, state: toClientState(room, runtime, userId) };
}

export async function getViewerXp(userId: string): Promise<{
  totalXp: number;
  level: number;
}> {
  const xp = await userRepo.getXp(userId);
  return { totalXp: xp, level: levelFromXp(xp) };
}

export function errorStatus(error: MusicRoomError): number {
  switch (error) {
    case "unauthorized":
      return 401;
    case "banned":
      return 403;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limited":
    case "cooldown":
      return 429;
    case "duplicate_content":
      return 409;
    case "already_in_queue":
    case "already_dj":
    case "not_in_queue":
    case "not_dj":
    case "duplicate_reaction":
    case "invalid":
      return 400;
    default:
      return 400;
  }
}

export function errorMessage(error: MusicRoomError): string {
  switch (error) {
    case "unauthorized":
      return "Faça login para continuar.";
    case "banned":
      return "Conta suspensa.";
    case "forbidden":
      return "Sem permissão.";
    case "not_found":
      return "Sala não encontrada.";
    case "invalid":
      return "Dados inválidos.";
    case "already_in_queue":
      return "Você já está na fila.";
    case "already_dj":
      return "Você já é o DJ atual.";
    case "not_in_queue":
      return "Você não está na fila.";
    case "not_dj":
      return "Apenas o DJ pode fazer isso.";
    case "duplicate_reaction":
      return "Você já reagiu a esta música.";
    case "rate_limited":
      return "Muitas ações. Aguarde um pouco.";
    case "cooldown":
      return "Aguarde um momento antes de enviar outra mensagem.";
    case "duplicate_content":
      return "Mensagem duplicada.";
    default:
      return "Erro na sala musical.";
  }
}
