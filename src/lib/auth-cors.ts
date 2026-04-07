/** Origens permitidas para CORS (devem coincidir com Better Auth trustedOrigins). */

function normalizeOriginString(raw: string): string | null {
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

/**
 * Se a URL for apex (`dominio.tld`) ou `www.dominio.tld`, devolve a variante irmã
 * para o mesmo site servir em ambos sem falha de CORS.
 */
function siblingWwwOrigin(origin: string): string | null {
  try {
    const u = new URL(origin);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost")) return null;
    const parts = h.split(".");
    if (parts[0] === "www" && parts.length >= 3) {
      return `${u.protocol}//${parts.slice(1).join(".")}`;
    }
    if (parts[0] !== "www" && parts.length === 2) {
      return `${u.protocol}//www.${h}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Base + BETTER_AUTH_TRUSTED_ORIGINS + par www/apex quando aplicável. */
export function getTrustedOrigins(): string[] {
  const base =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const baseOrigin = base ? normalizeOriginString(base) : null;
  const extra =
    process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => normalizeOriginString(s))
      .filter((o): o is string => o !== null) ?? [];
  const set = new Set<string>();
  if (baseOrigin) set.add(baseOrigin);
  for (const o of extra) set.add(o);
  for (const o of [...set]) {
    const sib = siblingWwwOrigin(o);
    if (sib) set.add(sib);
  }
  return [...set];
}

function getAllowedOrigins(): string[] {
  return getTrustedOrigins();
}

const DEFAULT_CORS_ALLOW_HEADERS = [
  "Content-Type",
  "Authorization",
  "Cookie",
  "X-Requested-With",
  "Accept",
  "Origin",
  "Better-Auth-Cookie",
].join(", ");

function buildCorsHeaders(origin: string, request?: Request): Headers {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Credentials", "true");
  h.set(
    "Access-Control-Allow-Methods",
    "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  // Preflight: o browser envia Access-Control-Request-Headers; a resposta deve
  // permitir exatamente esses nomes, senão o preflight falha (provisional headers).
  const requested = request?.headers.get("Access-Control-Request-Headers");
  h.set(
    "Access-Control-Allow-Headers",
    requested?.trim() ? requested : DEFAULT_CORS_ALLOW_HEADERS
  );
  h.set("Access-Control-Max-Age", "86400");
  h.set("Vary", "Origin");
  return h;
}

/** Retorna cabeçalhos CORS se `Origin` estiver na lista permitida. */
export function corsHeadersForRequest(request: Request): Headers | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const normalized = normalizeOriginString(origin);
  if (!normalized) return null;
  const allowed = getAllowedOrigins();
  if (!allowed.includes(normalized)) return null;
  return buildCorsHeaders(normalized, request);
}

export function mergeCorsIntoResponse(
  response: Response,
  request: Request
): Response {
  const headers = new Headers(response.headers);
  headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate"
  );
  const cors = corsHeadersForRequest(request);
  if (cors) {
    cors.forEach((value, key) => {
      headers.set(key, value);
    });
  }
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
