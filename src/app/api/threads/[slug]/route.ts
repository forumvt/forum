import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { resolveActor } from "@/lib/session-actor";
import * as threadService from "@/services/thread.service";

const updateOriginalPostSchema = z.object({
  description: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const thread = await threadService.getThreadForApi(slug);

  if (!thread) {
    return new Response(JSON.stringify({ error: "Thread not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(thread), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();
  const validation = updateOriginalPostSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const actor = await resolveActor(session.user);
  const result = await threadService.updateOriginalPost(
    slug,
    validation.data.description,
    actor,
  );

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    updatedAt: result.updatedAt.toISOString(),
  });
}
