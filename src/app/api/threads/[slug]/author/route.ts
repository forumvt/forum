import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminActor } from "@/lib/staff-guard";
import * as threadService from "@/services/thread.service";

const changeAuthorSchema = z.object({
  userId: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdminActor();
  if (!admin.ok) return admin.response;

  const { slug } = await params;
  const body = await request.json();
  const validation = changeAuthorSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await threadService.changeThreadAuthor(
    slug,
    validation.data.userId,
    admin.actor,
  );

  if (!result.ok) {
    if (result.error === "not_found" || result.error === "user_not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.error === "same") {
      return NextResponse.json(
        { error: "O autor já é este usuário" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, author: result.author });
}
