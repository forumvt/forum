export type ReportTargetType = "post" | "thread" | "user";
export type ReportStatus = "open" | "resolved" | "dismissed";

export type ModerationAction =
  | "lock"
  | "unlock"
  | "pin"
  | "unpin"
  | "move"
  | "delete_thread"
  | "restore_thread"
  | "delete_post"
  | "restore_post"
  | "ban"
  | "unban"
  | "role_change"
  | "resolve_report"
  | "dismiss_report";

export interface ModerationLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: Date;
  actorName: string | null;
}

export interface ModerationReportItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  reporterName: string | null;
  reporterUserId: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "ADMINISTRATOR" | "MODERATOR" | "USER";
  createdAt: Date;
  bannedAt: Date | null;
  banReason: string | null;
}

export interface ModerationOverview {
  openReports: number;
  bannedUsers: number;
  lockedThreads: number;
  deletedThreads: number;
}
