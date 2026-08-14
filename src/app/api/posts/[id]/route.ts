import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { resolveActor } from "@/lib/session-actor";
import * as postService from "@/services/post.service";

const updatePostSchema = z.object({
  content: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const validation = updatePostSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const actor = await resolveActor(session.user);
  const result = await postService.updatePostContent(
    id,
    validation.data.content,
    actor,
  );

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    updatedAt: result.updatedAt.toISOString(),
  });
}
