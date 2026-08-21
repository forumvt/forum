import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffActor } from "@/lib/staff-guard";
import * as moderationService from "@/services/moderation.service";

const updateUserSchema = z.object({
  banned: z.boolean().optional(),
  banReason: z.string().max(300).optional(),
  role: z.enum(["USER", "MODERATOR", "ADMINISTRATOR"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaffActor();
  if (!staff.ok) return staff.response;

  const { id } = await params;
  const body = await request.json();
  const validation = updateUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const targetId = decodeURIComponent(id);

  if (typeof validation.data.banned === "boolean") {
    const result = await moderationService.setUserBan(
      staff.actor,
      targetId,
      validation.data.banned,
      validation.data.banReason,
    );
    if (!result.ok) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "self"
            ? 400
            : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
  }

  if (validation.data.role) {
    const result = await moderationService.setUserRole(
      staff.actor,
      targetId,
      validation.data.role,
    );
    if (!result.ok) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "self"
            ? 400
            : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
  }

  return NextResponse.json({ success: true });
}
