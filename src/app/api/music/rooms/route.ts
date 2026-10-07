import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/staff-guard";
import * as musicRoomService from "@/services/music-room.service";
import { MUSIC_ROOM_DESC_MAX, MUSIC_ROOM_NAME_MAX } from "@/types/music";

export async function GET() {
  const rooms = await musicRoomService.listRooms();
  return NextResponse.json({ rooms });
}

const createSchema = z.object({
  name: z.string().trim().min(3).max(MUSIC_ROOM_NAME_MAX),
  description: z.string().trim().max(MUSIC_ROOM_DESC_MAX).optional(),
});

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await musicRoomService.createRoom(session.userId, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: musicRoomService.errorMessage(result.error),
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: musicRoomService.errorStatus(result.error) },
    );
  }

  return NextResponse.json({ roomId: result.roomId }, { status: 201 });
}
