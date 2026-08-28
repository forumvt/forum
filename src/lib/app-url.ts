/**
 * URL pública do app (para redirects absolutos em fluxos de auth no cliente).
 */
export function getPublicAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}

export function userProfilePath(userId: string): string {
  return `/users/${encodeURIComponent(userId)}`;
}

export function pmNewPath(userId?: string): string {
  if (!userId) return "/mensagens/nova";
  return `/mensagens/nova?para=${encodeURIComponent(userId)}`;
}

export function pmConversationPath(conversationId: string): string {
  return `/mensagens/${encodeURIComponent(conversationId)}`;
}
