import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";
import * as pmService from "@/services/pm.service";

export async function GET(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const exclude = url.searchParams.getAll("exclude");
  const people = await pmService.searchPeople(session.userId, query, exclude);
  return NextResponse.json({ people });
}
