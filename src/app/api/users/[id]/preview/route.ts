import { NextResponse } from "next/server";

import * as userService from "@/services/user.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const preview = await userService.getPreview(decodeURIComponent(id));

  if (!preview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(preview);
}
