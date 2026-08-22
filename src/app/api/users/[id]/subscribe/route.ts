import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import * as subscriptionService from "@/services/subscription.service";

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
  const result = await subscriptionService.toggleSubscribe(
    session.user.id,
    decodeURIComponent(id),
  );

  if (!result.ok) {
    if (result.error === "banned") {
      return NextResponse.json(
        { error: "Conta suspensa", reason: result.reason },
        { status: 403 },
      );
    }
    if (result.error === "self") {
      return NextResponse.json(
        { error: "Não é possível dar sub em si mesmo" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    subscribed: result.subscribed,
    subscriberCount: result.subscriberCount,
  });
}
