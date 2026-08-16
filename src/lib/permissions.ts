export type UserRole = "ADMINISTRATOR" | "MODERATOR" | "USER";

export function isStaff(role?: string | null): boolean {
  return role === "ADMINISTRATOR" || role === "MODERATOR";
}

export function canEditPost(
  sessionUserId: string | undefined,
  sessionRole: string | undefined,
  authorId: string,
): boolean {
  if (!sessionUserId) return false;
  if (authorId && sessionUserId === authorId) return true;
  return isStaff(sessionRole);
}

export function getSessionRole(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) return undefined;
  const role = (user as { role: unknown }).role;
  return typeof role === "string" ? role : undefined;
}
