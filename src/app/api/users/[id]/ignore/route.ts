import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import * as ignoreService from "@/services/ignore.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await ignoreService.toggleIgnore(
    session.user.id,
    decodeURIComponent(id),
  );

  if (!result.ok) {
    if (result.error === "self") {
      return NextResponse.json(
        { error: "Não é possível ignorar a si mesmo" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ignored: result.ignored });
}
