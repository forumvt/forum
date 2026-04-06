/** Origens permitidas para CORS (devem coincidir com Better Auth trustedOrigins). */

function getAllowedOrigins(): string[] {
  const base =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const baseOrigin = base ? new URL(base).origin : null;
  const extra =
    process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const set = new Set<string>();
  if (baseOrigin) set.add(baseOrigin);
  for (const o of extra) set.add(o);
  return [...set];
}

function buildCorsHeaders(origin: string): Headers {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Better-Auth-Cookie",
    ].join(", ")
  );
  h.set("Access-Control-Max-Age", "86400");
  h.set("Vary", "Origin");
  return h;
}

/** Retorna cabeçalhos CORS se `Origin` estiver na lista permitida. */
export function corsHeadersForRequest(request: Request): Headers | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (!getAllowedOrigins().includes(origin)) return null;
  return buildCorsHeaders(origin);
}

export function mergeCorsIntoResponse(
  response: Response,
  request: Request
): Response {
  const cors = corsHeadersForRequest(request);
  if (!cors) return response;
  const headers = new Headers(response.headers);
  cors.forEach((value, key) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Resposta ao preflight; 204 só com CORS se a origem for permitida. */
export function corsPreflightResponse(request: Request): Response {
  const cors = corsHeadersForRequest(request);
  if (!cors) {
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 204, headers: cors });
}
