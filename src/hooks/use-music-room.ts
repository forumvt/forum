"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { MUSIC_REALTIME_EVENTS } from "@/lib/music/events";
import type {
  MusicConnectionStatus,
  MusicReactionKind,
  MusicRoomState,
} from "@/types/music";

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  return data?.error ?? "Falha na requisição";
}

export function useMusicRoom(roomId: string) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const [state, setState] = useState<MusicRoomState | null>(null);
  const [status, setStatus] = useState<MusicConnectionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [xp, setXp] = useState<{ totalXp: number; level: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const leftRef = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);

  const applyState = useCallback((next: MusicRoomState) => {
    setState(next);
    setError(null);
  }, []);

  useEffect(() => {
    connectRef.current = () => {
      if (!roomId || leftRef.current) return;
      setStatus((prev) =>
        prev === "connected"
          ? "connected"
          : prev === "loading"
            ? "connecting"
            : "reconnecting",
      );

      esRef.current?.close();
      const es = new EventSource(`/api/music/rooms/${roomId}/stream`);
      esRef.current = es;

      es.addEventListener(MUSIC_REALTIME_EVENTS.ROOM_STATE, (event) => {
        try {
          const payload = JSON.parse(
            (event as MessageEvent).data,
          ) as MusicRoomState;
          applyState(payload);
          setStatus("connected");
        } catch {
          // ignore malformed
        }
      });

      es.addEventListener(MUSIC_REALTIME_EVENTS.CONNECTION, (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as {
            status: MusicConnectionStatus;
            message?: string;
          };
          if (payload.status === "error") {
            setStatus("error");
            setError(payload.message ?? "Erro de conexão");
          } else if (payload.status === "reconnecting") {
            setStatus("reconnecting");
          } else if (payload.status === "connected") {
            setStatus("connected");
          }
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        setStatus("reconnecting");
        es.close();
        window.setTimeout(() => {
          if (!leftRef.current) connectRef.current();
        }, 2000);
      };
    };
  }, [applyState, roomId]);

  useEffect(() => {
    leftRef.current = false;
    let cancelled = false;

    async function bootstrap() {
      if (!userId) {
        setStatus("error");
        setError("Faça login para entrar na sala.");
        return;
      }

      setStatus("connecting");
      try {
        const joinRes = await fetch(`/api/music/rooms/${roomId}/join`, {
          method: "POST",
        });
        if (!joinRes.ok) {
          setError(await readError(joinRes));
          setStatus("error");
          return;
        }
        const joinData = (await joinRes.json()) as {
          state: MusicRoomState;
          xp?: { totalXp: number; level: number };
        };
        if (!cancelled) {
          applyState(joinData.state);
          if (joinData.xp) setXp(joinData.xp);
        }
        connectRef.current();
      } catch {
        if (!cancelled) {
          setError("Não foi possível entrar na sala.");
          setStatus("error");
        }
      }
    }

    void bootstrap();

    const heartbeat = window.setInterval(() => {
      if (!userId || leftRef.current) return;
      void fetch(`/api/music/rooms/${roomId}/heartbeat`, { method: "POST" })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as {
            state: MusicRoomState;
            xp?: { totalXp: number; level: number };
          };
          applyState(data.state);
          if (data.xp) setXp(data.xp);
        })
        .catch(() => undefined);
    }, 20000);

    return () => {
      cancelled = true;
      leftRef.current = true;
      window.clearInterval(heartbeat);
      esRef.current?.close();
      void fetch(`/api/music/rooms/${roomId}/leave`, { method: "POST" }).catch(
        () => undefined,
      );
    };
  }, [applyState, roomId, userId]);

  const runAction = useCallback(
    async (key: string, exec: () => Promise<Response>) => {
      setActionLoading(key);
      try {
        const res = await exec();
        if (!res.ok) {
          setError(await readError(res));
          return false;
        }
        const data = (await res.json()) as { state?: MusicRoomState };
        if (data.state) applyState(data.state);
        return true;
      } catch {
        setError("Falha de rede");
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [applyState],
  );

  const sendChat = useCallback(
    (message: string) =>
      runAction("chat", () =>
        fetch(`/api/music/rooms/${roomId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }),
      ),
    [roomId, runAction],
  );

  const joinQueue = useCallback(
    () =>
      runAction("queue-join", () =>
        fetch(`/api/music/rooms/${roomId}/queue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join" }),
        }),
      ),
    [roomId, runAction],
  );

  const leaveQueue = useCallback(
    () =>
      runAction("queue-leave", () =>
        fetch(`/api/music/rooms/${roomId}/queue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave" }),
        }),
      ),
    [roomId, runAction],
  );

  const skipSong = useCallback(
    () =>
      runAction("skip", () =>
        fetch(`/api/music/rooms/${roomId}/skip`, { method: "POST" }),
      ),
    [roomId, runAction],
  );

  const react = useCallback(
    (kind: MusicReactionKind) =>
      runAction(`react-${kind}`, () =>
        fetch(`/api/music/rooms/${roomId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        }),
      ),
    [roomId, runAction],
  );

  return {
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
  };
}
