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

export function getSessionRole(
  user: { role?: unknown } | null | undefined,
): string | undefined {
  if (typeof user?.role === "string") return user.role;
  return undefined;
}
