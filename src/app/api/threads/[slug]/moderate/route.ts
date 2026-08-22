import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { resolveActor } from "@/lib/session-actor";
import * as threadService from "@/services/thread.service";

const moderateSchema = z.object({
  action: z.enum([
    "lock",
    "unlock",
    "pin",
    "unpin",
    "move",
    "delete",
    "restore",
  ]),
  forumId: z.string().uuid().optional(),
});

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
  const validation = moderateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const actor = await resolveActor(session.user);
  const result = await threadService.moderateThread(
    slug,
    actor,
    validation.data,
  );

  if (!result.ok) {
    if (result.error === "banned") {
      return NextResponse.json(
        { error: "Conta suspensa", reason: result.reason },
        { status: 403 },
      );
    }
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (result.error === "invalid") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
