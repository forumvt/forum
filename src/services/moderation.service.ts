import {
  canAssignRole,
  canBanUser,
  toUserRole,
  type UserRole,
} from "@/lib/permissions";
import * as forumRepo from "@/repositories/forum.repository";
import * as moderationRepo from "@/repositories/moderation.repository";
import * as postRepo from "@/repositories/post.repository";
import * as threadRepo from "@/repositories/thread.repository";
import * as userRepo from "@/repositories/user.repository";
import type {
  AdminUserItem,
  ModerationLogItem,
  ModerationOverview,
  ModerationReportItem,
  ReportStatus,
  ReportTargetType,
} from "@/types/moderation";

export async function logAction(data: {
  actorUserId: string;
  action: Parameters<typeof moderationRepo.writeLog>[0]["action"];
  targetType: string;
  targetId: string;
  details?: string | null;
}): Promise<void> {
  await moderationRepo.writeLog(data);
}

export async function getOverview(): Promise<ModerationOverview> {
  return moderationRepo.getOverview();
}

export async function listLogs(
  page: number,
  per: number,
): Promise<{
  logs: ModerationLogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const { logs, totalCount } = await moderationRepo.listLogs({ page, per });
  const totalPages = Math.ceil(totalCount / per) || 1;
  return {
    logs,
    totalCount,
    totalPages,
    currentPage: Math.min(Math.max(1, page), totalPages),
  };
}

export async function listUsers(params: {
  query?: string;
  page: number;
  per: number;
}): Promise<{
  users: AdminUserItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const { users, totalCount } = await userRepo.findAdminPaginated(params);
  const totalPages = Math.ceil(totalCount / params.per) || 1;
  return {
    users,
    totalCount,
    totalPages,
    currentPage: Math.min(Math.max(1, params.page), totalPages),
  };
}

export async function listReports(params: {
  status?: ReportStatus;
  page: number;
  per: number;
}): Promise<{
  reports: ModerationReportItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const { reports, totalCount } = await moderationRepo.listReports(params);
  const totalPages = Math.ceil(totalCount / params.per) || 1;
  return {
    reports,
    totalCount,
    totalPages,
    currentPage: Math.min(Math.max(1, params.page), totalPages),
  };
}

export async function createReport(
  reporterUserId: string,
  data: { targetType: ReportTargetType; targetId: string; reason: string },
): Promise<{ ok: true } | { ok: false; error: "duplicate" | "invalid" }> {
  const reason = data.reason.trim();
  if (reason.length < 3 || reason.length > 500) {
    return { ok: false, error: "invalid" };
  }
  if (data.targetType === "user" && data.targetId === reporterUserId) {
    return { ok: false, error: "invalid" };
  }
  if (data.targetType === "post") {
    const post = await postRepo.findById(data.targetId);
    if (!post) return { ok: false, error: "invalid" };
  }
  if (data.targetType === "thread") {
    const thread = await threadRepo.findMetaById(data.targetId);
    if (!thread) return { ok: false, error: "invalid" };
  }
  if (data.targetType === "user") {
    const user = await userRepo.findPublicById(data.targetId);
    if (!user) return { ok: false, error: "invalid" };
  }

  const created = await moderationRepo.createReport({
    reporterUserId,
    targetType: data.targetType,
    targetId: data.targetId,
    reason,
  });
  if ("duplicate" in created) return { ok: false, error: "duplicate" };
  return { ok: true };
}

export async function resolveReport(
  reportId: string,
  actorUserId: string,
  status: Exclude<ReportStatus, "open">,
): Promise<boolean> {
  const ok = await moderationRepo.setReportStatus(
    reportId,
    status,
    actorUserId,
  );
  if (ok) {
    await moderationRepo.writeLog({
      actorUserId,
      action: status === "resolved" ? "resolve_report" : "dismiss_report",
      targetType: "report",
      targetId: reportId,
    });
  }
  return ok;
}

export type BanResult =
  | { ok: true; banned: boolean }
  | { ok: false; error: "not_found" | "forbidden" | "self" };

export async function setUserBan(
  actor: { id: string; role?: string },
  targetUserId: string,
  banned: boolean,
  reason?: string | null,
): Promise<BanResult> {
  if (actor.id === targetUserId) return { ok: false, error: "self" };
  const target = await userRepo.findPublicById(targetUserId);
  if (!target) return { ok: false, error: "not_found" };
  if (!canBanUser(actor.role, target.role)) {
    return { ok: false, error: "forbidden" };
  }
  await userRepo.setBan(targetUserId, banned, reason);
  await moderationRepo.writeLog({
    actorUserId: actor.id,
    action: banned ? "ban" : "unban",
    targetType: "user",
    targetId: targetUserId,
    details: banned ? reason : null,
  });
  return { ok: true, banned };
}

export type RoleResult =
  | { ok: true; role: UserRole }
  | { ok: false; error: "not_found" | "forbidden" | "self" };

export async function setUserRole(
  actor: { id: string; role?: string },
  targetUserId: string,
  nextRole: UserRole,
): Promise<RoleResult> {
  if (actor.id === targetUserId) return { ok: false, error: "self" };
  if (!canAssignRole(actor.role)) return { ok: false, error: "forbidden" };
  const target = await userRepo.findPublicById(targetUserId);
  if (!target) return { ok: false, error: "not_found" };
  await userRepo.setRole(targetUserId, nextRole);
  await moderationRepo.writeLog({
    actorUserId: actor.id,
    action: "role_change",
    targetType: "user",
    targetId: targetUserId,
    details: `${toUserRole(target.role)} → ${nextRole}`,
  });
  return { ok: true, role: nextRole };
}

export async function getWriteBlock(
  userId: string,
): Promise<{ blocked: false } | { blocked: true; reason: string | null }> {
  const ban = await userRepo.findBanById(userId);
  if (ban?.bannedAt) {
    return { blocked: true, reason: ban.banReason };
  }
  return { blocked: false };
}

export async function forumExists(forumId: string): Promise<boolean> {
  const forum = await forumRepo.findById(forumId);
  return Boolean(forum);
}
