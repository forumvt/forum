import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";
import * as userRepo from "@/repositories/user.repository";

const DEFAULT_USER_IMAGE = "https://www.subeiros.com/eris-apple.png";

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

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

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
    return NextResponse.json({ ok: true });
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

  try {
    await userRepo.updateAvatar(session.userId, DEFAULT_USER_IMAGE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao remover o avatar" },
      { status: 500 },
    );
  }
}
