import { toNextJsHandler } from "better-auth/next-js";

import { mergeCorsIntoResponse, corsPreflightResponse } from "@/lib/auth-cors";
import { auth } from "@/lib/auth";

/** Evita cache em CDN sem Vary: Origin (respostas sem CORS corretos). */
export const dynamic = "force-dynamic";

const { GET: authHandler } = toNextJsHandler(auth);

const run = async (request: Request) => {
  const response = await authHandler(request);
  return mergeCorsIntoResponse(response, request);
};

export const GET = run;
export const POST = run;

export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request);
}