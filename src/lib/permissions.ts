export type UserRole = "ADMINISTRATOR" | "MODERATOR" | "USER";

export function isAdmin(role?: string | null): boolean {
  return role === "ADMINISTRATOR";
}

export function isStaff(role?: string | null): boolean {
  return role === "ADMINISTRATOR" || role === "MODERATOR";
}

export function roleLabel(role?: string | null): string {
  switch (role) {
    case "ADMINISTRATOR":
      return "Administrador";
    case "MODERATOR":
      return "Moderador";
    default:
      return "Membro";
  }
}

export function toUserRole(role?: string | null): UserRole {
  if (role === "ADMINISTRATOR" || role === "MODERATOR") return role;
  return "USER";
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

export function canDeletePost(
  sessionUserId: string | undefined,
  sessionRole: string | undefined,
  authorId: string,
): boolean {
  return canEditPost(sessionUserId, sessionRole, authorId);
}

export function canDeleteThread(
  sessionUserId: string | undefined,
  sessionRole: string | undefined,
  authorId: string,
): boolean {
  return canEditPost(sessionUserId, sessionRole, authorId);
}

export function canModerateContent(role?: string | null): boolean {
  return isStaff(role);
}

export function canBanUser(
  actorRole?: string | null,
  targetRole?: string | null,
): boolean {
  if (!isStaff(actorRole)) return false;
  if (targetRole === "ADMINISTRATOR") return false;
  if (isAdmin(actorRole)) return true;
  return toUserRole(targetRole) === "USER";
}

export function canAssignRole(actorRole?: string | null): boolean {
  return isAdmin(actorRole);
}

export function canChangeAuthor(role?: string | null): boolean {
  return isAdmin(role);
}

export function getSessionRole(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) return undefined;
  const role = (user as { role: unknown }).role;
  return typeof role === "string" ? role : undefined;
}
