import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  abuseErrorMessage,
  abuseErrorStatus,
} from "@/lib/abuse-guard";
import { auth } from "@/lib/auth";
import { POST_MAX_LENGTH } from "@/lib/rate-limit-config";
import * as postService from "@/services/post.service";

const addReplySchema = z.object({
  content: z.string().min(1).max(POST_MAX_LENGTH),
  threadId: z.string().min(1),
  quotedUserId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = addReplySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 },
      );
    }

    const { content, threadId, quotedUserId } = validation.data;

    const result = await postService.addReply(
      threadId,
      session.user.id,
      content,
      quotedUserId ?? null,
    );

    if (!result.ok) {
      if (result.error === "banned") {
        return NextResponse.json(
          { error: "Conta suspensa", reason: result.reason },
          { status: 403 },
        );
      }
      if (result.error === "locked") {
        return NextResponse.json(
          { error: "Este tópico está trancado." },
          { status: 403 },
        );
      }
      if (
        result.error === "rate_limited" ||
        result.error === "cooldown" ||
        result.error === "duplicate_content"
      ) {
        return NextResponse.json(
          {
            error: abuseErrorMessage(result.error),
            retryAfterSeconds: result.retryAfterSeconds,
          },
          { status: abuseErrorStatus(result.error) },
        );
      }
      return NextResponse.json(
        { error: "Tópico não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, post: { id: result.id } });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
