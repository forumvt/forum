/** Host canônico (apex). `www.subeiros.com` redireciona para cá. */
export const CANONICAL_SITE_ORIGIN = "https://subeiros.com";

export const SITE_NAME = "VT Forums";

export const SITE_DESCRIPTION =
  "Fórum brasileiro de discussão livre — política, games, vale-tudo e discórdia. All Hail Eris! All Hail Discordia!";

export const NOINDEX_ROBOTS = { index: false, follow: false } as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `${CANONICAL_SITE_ORIGIN}/`;
  }
  return `${CANONICAL_SITE_ORIGIN}${normalized}`;
}

export function plainTextExcerpt(
  value: string | null | undefined,
  max = 160,
): string {
  const stripped = (value ?? "")
    .replace(/\[\/?[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "";
  if (stripped.length <= max) return stripped;
  return `${stripped.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}
