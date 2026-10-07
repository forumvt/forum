import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/staff-guard";
import * as musicRoomService from "@/services/music-room.service";

type Params = { params: Promise<{ roomId: string }> };

const bodySchema = z.object({
  action: z.enum(["join", "leave"]),
});

export async function POST(request: Request, { params }: Params) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { roomId } = await params;
  const result =
    parsed.data.action === "join"
      ? await musicRoomService.joinQueue(roomId, session.userId)
      : await musicRoomService.leaveQueue(roomId, session.userId);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: musicRoomService.errorMessage(result.error),
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: musicRoomService.errorStatus(result.error) },
    );
  }

  return NextResponse.json({ state: result.state });
}
