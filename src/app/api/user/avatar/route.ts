import { NextResponse } from "next/server";

import {
  assertAvatarChangeAllowed,
  getAvatarLimitStatus,
  recordAvatarChange,
} from "@/lib/avatar-limit";
import { requireSessionUser } from "@/lib/staff-guard";
import { DEFAULT_USER_IMAGE } from "@/lib/user-defaults";
import * as userRepo from "@/repositories/user.repository";
import * as moderationService from "@/services/moderation.service";

function isCloudinaryHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host === "res.cloudinary.com" || host.endsWith(".cloudinary.com");
  } catch {
    return false;
  }
}

function avatarLimitResponse(status: Awaited<ReturnType<typeof getAvatarLimitStatus>>) {
  return NextResponse.json(
    {
      error: "Limite diário de alterações de avatar atingido.",
      ...status,
    },
    { status: 403 },
  );
}

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const status = await getAvatarLimitStatus(session.userId);
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const block = await moderationService.getWriteBlock(session.userId);
  if (block.blocked) {
    return NextResponse.json(
      { error: "Conta suspensa", reason: block.reason },
      { status: 403 },
    );
  }

  const limit = await assertAvatarChangeAllowed(session.userId);
  if (!limit.ok) {
    return avatarLimitResponse(limit.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Parâmetros faltando" }, { status: 400 });
  }

  const image =
    typeof body === "object" && body !== null && "image" in body
      ? (body as { image: unknown }).image
      : undefined;

  if (!isCloudinaryHttpsUrl(image)) {
    return NextResponse.json({ error: "URL de imagem inválida" }, { status: 400 });
  }

  try {
    await userRepo.updateAvatar(session.userId, image);
    await recordAvatarChange(session.userId);
    const status = await getAvatarLimitStatus(session.userId);
    return NextResponse.json({ ok: true, ...status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao atualizar avatar" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const block = await moderationService.getWriteBlock(session.userId);
  if (block.blocked) {
    return NextResponse.json(
      { error: "Conta suspensa", reason: block.reason },
      { status: 403 },
    );
  }

  const limit = await assertAvatarChangeAllowed(session.userId);
  if (!limit.ok) {
    return avatarLimitResponse(limit.status);
  }

  try {
    await userRepo.updateAvatar(session.userId, DEFAULT_USER_IMAGE);
    await recordAvatarChange(session.userId);
    const status = await getAvatarLimitStatus(session.userId);
    return NextResponse.json({ ok: true, ...status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao remover o avatar" },
      { status: 500 },
    );
  }
}
