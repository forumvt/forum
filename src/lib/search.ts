import { stripBBCode } from "@/utils/bbcode-parser";

export const MIN_SEARCH_QUERY_LENGTH = 2;
export const SEARCH_SNIPPET_LENGTH = 180;

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

/** Remove ILIKE wildcards so user input is treated as literal text. */
export function toIlikePattern(query: string): string {
  const sanitized = normalizeSearchQuery(query).replace(/[%_\\]/g, " ");
  return `%${sanitized}%`;
}

export function excerptAroundMatch(
  text: string,
  query: string,
  maxLength = SEARCH_SNIPPET_LENGTH,
): string {
  const stripped = stripBBCode(text);
  if (!stripped) return "";

  const lower = stripped.toLowerCase();
  const term = normalizeSearchQuery(query).toLowerCase();
  const idx = term ? lower.indexOf(term) : -1;

  if (idx < 0) {
    return stripped.length > maxLength
      ? `${stripped.slice(0, maxLength)}…`
      : stripped;
  }

  const extra = Math.max(0, maxLength - term.length);
  const before = Math.floor(extra / 2);
  let start = Math.max(0, idx - before);
  const end = Math.min(stripped.length, start + maxLength);
  if (end - start < maxLength) {
    start = Math.max(0, end - maxLength);
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < stripped.length ? "…" : "";
  return `${prefix}${stripped.slice(start, end)}${suffix}`;
}
