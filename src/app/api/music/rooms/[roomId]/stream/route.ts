import { auth } from "@/lib/auth";
import { MUSIC_REALTIME_EVENTS } from "@/lib/music/events";
import * as musicRoomService from "@/services/music-room.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const viewerId = session?.user?.id ?? null;

  const initial = await musicRoomService.getRoomState(roomId, viewerId);
  if (!initial.ok) {
    return new Response(
      JSON.stringify({ error: musicRoomService.errorMessage(initial.error) }),
      {
        status: musicRoomService.errorStatus(initial.error),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let lastVersion = -1;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send(MUSIC_REALTIME_EVENTS.CONNECTION, {
        status: "connected",
      });
      send(MUSIC_REALTIME_EVENTS.ROOM_STATE, initial.state);
      lastVersion = initial.state.version;

      const tick = async () => {
        if (closed) return;
        try {
          const result = await musicRoomService.getRoomState(roomId, viewerId);
          if (!result.ok) {
            send(MUSIC_REALTIME_EVENTS.CONNECTION, {
              status: "error",
              message: musicRoomService.errorMessage(result.error),
            });
            return;
          }
          if (result.state.version !== lastVersion) {
            lastVersion = result.state.version;
            send(MUSIC_REALTIME_EVENTS.ROOM_STATE, result.state);
          }
        } catch {
          send(MUSIC_REALTIME_EVENTS.CONNECTION, {
            status: "reconnecting",
            message: "Falha ao sincronizar estado",
          });
        }
      };

      const interval = setInterval(() => {
        void tick();
      }, 1200);

      const heartbeat = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", abort);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
