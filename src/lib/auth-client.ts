import { createAuthClient } from "better-auth/react";

/** No browser, usa o mesmo host da página (evita CORS apex vs www). No SSR, cai no env. */
function resolveAuthApiBase(): string | undefined {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/auth`;
  }
  const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return appBase ? `${appBase}/api/auth` : undefined;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthApiBase(),
});