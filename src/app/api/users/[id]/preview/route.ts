import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import * as userService from "@/services/user.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id } = await params;
  const preview = await userService.getPreview(
    decodeURIComponent(id),
    session?.user?.id ?? null,
  );

  if (!preview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(preview);
}
