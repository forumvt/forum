import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffActor } from "@/lib/staff-guard";
import * as moderationService from "@/services/moderation.service";

const updateReportSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaffActor();
  if (!staff.ok) return staff.response;

  const { id } = await params;
  const body = await request.json();
  const validation = updateReportSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ok = await moderationService.resolveReport(
    id,
    staff.actor.id,
    validation.data.status,
  );
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
