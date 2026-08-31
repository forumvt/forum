import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  abuseErrorMessage,
  abuseErrorStatus,
} from "@/lib/abuse-guard";
import { auth } from "@/lib/auth";
import * as likeService from "@/services/like.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const result = await likeService.toggleThreadLike(slug, session.user.id);

  if (!result.ok) {
    if (result.error === "banned") {
      return NextResponse.json(
        { error: "Conta suspensa", reason: result.reason },
        { status: 403 },
      );
    }
    if (result.error === "rate_limited") {
      return NextResponse.json(
        {
          error: abuseErrorMessage(result.error),
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: abuseErrorStatus(result.error) },
      );
    }
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json({ liked: result.liked });
}
