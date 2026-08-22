import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/staff-guard";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AVATAR_FOLDER = "avatars";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Upload indisponível" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const paramsToSign =
    isPlainObject(body) && isPlainObject(body.paramsToSign)
      ? body.paramsToSign
      : null;
  if (!paramsToSign) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const signature = cloudinary.utils.api_sign_request(
    { ...paramsToSign, folder: AVATAR_FOLDER },
    secret,
  );

  return NextResponse.json({ signature });
}
