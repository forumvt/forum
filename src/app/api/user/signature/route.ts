import { NextResponse } from "next/server";
import { z } from "zod";

import {
  abuseErrorMessage,
  abuseErrorStatus,
  isStaffUser,
} from "@/lib/abuse-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireSessionUser } from "@/lib/staff-guard";
import * as moderationService from "@/services/moderation.service";
import * as userService from "@/services/user.service";
import { SIGNATURE_MAX_LENGTH } from "@/types/user";

const signatureSchema = z
  .object({
    signature: z.string().max(SIGNATURE_MAX_LENGTH),
    showSignatures: z.boolean(),
  })
  .partial()
  .refine(
    (value) =>
      value.signature !== undefined || value.showSignatures !== undefined,
    { message: "Informe ao menos um campo" },
  );

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const settings = await userService.getSignatureSettings(session.userId);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const block = await moderationService.getWriteBlock(session.userId);
  if (block.blocked) {
    return NextResponse.json(
      { error: "Conta suspensa", reason: block.reason },
      { status: 403 },
    );
  }

  if (!(await isStaffUser(session.userId))) {
    const rate = await checkRateLimit("signatureUpdate", session.userId);
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: abuseErrorMessage(rate.error),
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        { status: abuseErrorStatus(rate.error) },
      );
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = signatureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const settings = await userService.saveSignatureSettings(
    session.userId,
    parsed.data,
  );
  return NextResponse.json({ settings });
}
