/**
 * URL pública do app (para redirects absolutos em fluxos de auth no cliente).
 */
export function getPublicAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}
