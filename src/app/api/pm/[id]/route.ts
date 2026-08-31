import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/staff-guard";
import * as pmService from "@/services/pm.service";
import { PM_MAX_LENGTH, PM_MAX_PARTICIPANTS } from "@/types/pm";

const replySchema = z.object({
  content: z.string().min(1).max(PM_MAX_LENGTH),
});

const addMembersSchema = z.object({
  addUserIds: z
    .array(z.string().min(1))
    .min(1)
    .max(PM_MAX_PARTICIPANTS - 1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await pmService.replyToConversation(
    session.userId,
    id,
    parsed.data.content,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: pmService.sendErrorMessage(result.error),
        reason: result.reason,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: pmService.sendErrorStatus(result.error) },
    );
  }

  return NextResponse.json({
    conversationId: result.conversationId,
    messageId: result.messageId,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = addMembersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await pmService.addMembers(
    session.userId,
    id,
    parsed.data.addUserIds,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: pmService.sendErrorMessage(result.error),
        reason: result.reason,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: pmService.sendErrorStatus(result.error) },
    );
  }

  return NextResponse.json({ ok: true, conversationId: result.conversationId });
}
