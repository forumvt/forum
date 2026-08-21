import { NextResponse } from "next/server";

import { requireStaffActor } from "@/lib/staff-guard";
import * as moderationService from "@/services/moderation.service";
import type { ReportStatus } from "@/types/moderation";

export async function GET(request: Request) {
  const staff = await requireStaffActor();
  if (!staff.ok) return staff.response;

  const url = new URL(request.url);
  const page = Math.max(
    1,
    parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
  );
  const per = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("per") ?? "20", 10) || 20),
  );
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "open" ||
    statusParam === "resolved" ||
    statusParam === "dismissed"
      ? (statusParam as ReportStatus)
      : undefined;

  const result = await moderationService.listReports({ status, page, per });
  return NextResponse.json(result);
}
