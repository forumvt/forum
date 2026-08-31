import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/staff-guard";
import * as pmService from "@/services/pm.service";
import { PM_MAX_LENGTH, PM_MAX_PARTICIPANTS } from "@/types/pm";

const startSchema = z
  .object({
    recipientUserId: z.string().min(1).optional(),
    recipientUserIds: z
      .array(z.string().min(1))
      .min(1)
      .max(PM_MAX_PARTICIPANTS - 1)
      .optional(),
    content: z.string().min(1).max(PM_MAX_LENGTH),
  })
  .refine(
    (value) =>
      Boolean(value.recipientUserId) ||
      (value.recipientUserIds && value.recipientUserIds.length > 0),
    { message: "Informe destinatários" },
  );

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const body = await request.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const recipientIds = parsed.data.recipientUserIds?.length
    ? parsed.data.recipientUserIds
    : parsed.data.recipientUserId
      ? [parsed.data.recipientUserId]
      : [];

  const result = await pmService.sendToUsers(
    session.userId,
    recipientIds,
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
