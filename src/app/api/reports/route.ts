import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/staff-guard";
import * as moderationService from "@/services/moderation.service";

const reportSchema = z.object({
  targetType: z.enum(["post", "thread", "user"]),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const body = await request.json();
  const validation = reportSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const result = await moderationService.createReport(
    session.userId,
    validation.data,
  );
  if (!result.ok) {
    if (result.error === "duplicate") {
      return NextResponse.json(
        { error: "Você já denunciou este conteúdo." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Denúncia inválida." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
