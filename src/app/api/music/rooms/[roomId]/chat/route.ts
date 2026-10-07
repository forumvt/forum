import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/staff-guard";
import * as musicRoomService from "@/services/music-room.service";
import { MUSIC_CHAT_MAX_LENGTH } from "@/types/music";

type Params = { params: Promise<{ roomId: string }> };

const bodySchema = z.object({
  message: z.string().trim().min(1).max(MUSIC_CHAT_MAX_LENGTH),
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
  const result = await musicRoomService.sendChat(
    roomId,
    session.userId,
    parsed.data.message,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: musicRoomService.errorMessage(result.error),
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: musicRoomService.errorStatus(result.error) },
    );
  }

  return NextResponse.json({ state: result.state, chat: result.chat });
}
