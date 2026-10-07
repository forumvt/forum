export const MUSIC_CHAT_MAX_LENGTH = 280;
export const MUSIC_ROOM_NAME_MAX = 60;
export const MUSIC_ROOM_DESC_MAX = 200;

export const MUSIC_REACTION_KINDS = ["heart", "fire", "laugh", "skull"] as const;
export type MusicReactionKind = (typeof MUSIC_REACTION_KINDS)[number];

export const MUSIC_REACTION_EMOJI: Record<MusicReactionKind, string> = {
  heart: "❤️",
  fire: "🔥",
  laugh: "😂",
  skull: "💀",
};

export type MusicSongSource = "youtube";

export interface MusicSong {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  source: MusicSongSource;
  /** Provider-specific id (ex.: YouTube videoId). */
  externalId: string;
}

export interface MusicRoomUser {
  id: string;
  name: string;
  avatar: string | null;
  role: "ADMINISTRATOR" | "MODERATOR" | "USER";
  joinedAt: string;
  isDj: boolean;
  queuePosition: number | null;
  isModerator: boolean;
}

export interface DjQueueItem {
  userId: string;
  name: string;
  avatar: string | null;
  joinedAt: string;
}

export interface MusicChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  message: string;
  createdAt: string;
}

export type MusicReactionCounts = Record<MusicReactionKind, number>;

export interface MusicRoomPlayback {
  currentSong: MusicSong | null;
  currentDj: MusicRoomUser | null;
  startedAt: string | null;
  duration: number;
}

export interface MusicRoomState {
  id: string;
  name: string;
  description: string | null;
  version: number;
  playback: MusicRoomPlayback;
  users: MusicRoomUser[];
  djQueue: DjQueueItem[];
  chat: MusicChatMessage[];
  reactions: MusicReactionCounts;
  myReaction: MusicReactionKind | null;
  onlineCount: number;
}

export interface MusicRoomListItem {
  id: string;
  name: string;
  description: string | null;
  onlineCount: number;
  currentDjName: string | null;
  currentSongTitle: string | null;
  currentSongArtist: string | null;
  status: "live" | "idle";
}

export const MUSIC_REALTIME_EVENTS = {
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_STATE: "room:state",
  CHAT_MESSAGE: "chat:message",
  QUEUE_JOIN: "queue:join",
  QUEUE_LEAVE: "queue:leave",
  DJ_CHANGE: "dj:change",
  SONG_START: "song:start",
  SONG_SKIP: "song:skip",
  REACTION_ADD: "reaction:add",
  CONNECTION: "connection",
} as const;

export type MusicRealtimeEventType =
  (typeof MUSIC_REALTIME_EVENTS)[keyof typeof MUSIC_REALTIME_EVENTS];

export type MusicConnectionStatus =
  | "loading"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export type MusicRealtimeEnvelope =
  | {
      type: typeof MUSIC_REALTIME_EVENTS.ROOM_STATE;
      payload: MusicRoomState;
      at: string;
    }
  | {
      type: typeof MUSIC_REALTIME_EVENTS.CHAT_MESSAGE;
      payload: MusicChatMessage;
      at: string;
    }
  | {
      type: typeof MUSIC_REALTIME_EVENTS.REACTION_ADD;
      payload: {
        reactions: MusicReactionCounts;
        kind: MusicReactionKind;
        userId: string;
      };
      at: string;
    }
  | {
      type: typeof MUSIC_REALTIME_EVENTS.CONNECTION;
      payload: { status: MusicConnectionStatus; message?: string };
      at: string;
    };

export type MusicXpAction =
  | "music_chat"
  | "music_reaction"
  | "music_queue_join"
  | "music_dj_song"
  | "music_first_dj";
