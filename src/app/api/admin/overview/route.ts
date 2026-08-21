import { NextResponse } from "next/server";

import { requireStaffActor } from "@/lib/staff-guard";
import * as moderationService from "@/services/moderation.service";

export async function GET() {
  const staff = await requireStaffActor();
  if (!staff.ok) return staff.response;

  const overview = await moderationService.getOverview();
  return NextResponse.json(overview);
}
