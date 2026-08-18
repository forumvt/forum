import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import * as notificationService from "@/services/notification.service";

const prefsSchema = z.object({
  ownThread: z.boolean(),
  viewedThread: z.boolean(),
  like: z.boolean(),
  reply: z.boolean(),
});

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await notificationService.getPreferences(session.user.id);
  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const preferences = await notificationService.savePreferences(
    session.user.id,
    parsed.data,
  );
  return NextResponse.json({ preferences });
}
