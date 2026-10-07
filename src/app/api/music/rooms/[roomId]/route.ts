import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import * as musicRoomService from "@/services/music-room.service";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { roomId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const result = await musicRoomService.getRoomState(
    roomId,
    session?.user?.id ?? null,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: musicRoomService.errorMessage(result.error) },
      { status: musicRoomService.errorStatus(result.error) },
    );
  }

  return NextResponse.json({ state: result.state });
}
