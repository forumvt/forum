import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import * as postService from "@/services/post.service";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, threadId, quotedUserId } = await request.json();

    if (!content || !threadId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await postService.addReply(
      threadId,
      session.user.id,
      content,
      typeof quotedUserId === "string" ? quotedUserId : null,
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
