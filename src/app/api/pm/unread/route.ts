import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";
import * as pmService from "@/services/pm.service";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const unreadCount = await pmService.getUnreadCount(session.userId);
  return NextResponse.json({ unreadCount });
}
