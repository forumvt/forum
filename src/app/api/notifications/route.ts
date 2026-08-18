import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import * as notificationService from "@/services/notification.service";

const patchSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: z.string().uuid() }),
]);

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await notificationService.listForUser(session.user.id);
  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if ("all" in parsed.data && parsed.data.all) {
    await notificationService.markAllAsRead(session.user.id);
  } else if ("id" in parsed.data) {
    await notificationService.markAsRead(session.user.id, parsed.data.id);
  }

  return NextResponse.json({ ok: true });
}
