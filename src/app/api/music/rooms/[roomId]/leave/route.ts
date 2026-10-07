import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";
import * as musicRoomService from "@/services/music-room.service";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const { roomId } = await params;
  const result = await musicRoomService.leaveRoom(roomId, session.userId);
  if (!result.ok) {
    return NextResponse.json(
      { error: musicRoomService.errorMessage(result.error) },
      { status: musicRoomService.errorStatus(result.error) },
    );
  }

  return NextResponse.json({ state: result.state });
}
