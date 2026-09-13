import { NextResponse } from "next/server";

import * as gameEventService from "@/services/game-event.service";

export async function GET() {
  return NextResponse.json({ games: gameEventService.listGamesCatalog() });
}
