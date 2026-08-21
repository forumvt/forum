import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  moderationLogTable,
  moderationReportTable,
  threadTable,
  userTable,
} from "@/db/schema";
import type {
  ModerationAction,
  ModerationLogItem,
  ModerationOverview,
  ModerationReportItem,
  ReportStatus,
  ReportTargetType,
} from "@/types/moderation";

export async function createReport(data: {
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<{ id: string } | { duplicate: true }> {
  const [existing] = await db
    .select({ id: moderationReportTable.id })
    .from(moderationReportTable)
    .where(
      and(
        eq(moderationReportTable.reporterUserId, data.reporterUserId),
        eq(moderationReportTable.targetType, data.targetType),
        eq(moderationReportTable.targetId, data.targetId),
        eq(moderationReportTable.status, "open"),
      ),
    )
    .limit(1);
  if (existing) return { duplicate: true };

  const [row] = await db
    .insert(moderationReportTable)
    .values({
      reporterUserId: data.reporterUserId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
    })
    .returning({ id: moderationReportTable.id });
  if (!row) throw new Error("Report insert failed");
  return { id: row.id };
}

export async function listReports(options: {
  status?: ReportStatus;
  page: number;
  per: number;
}): Promise<{ reports: ModerationReportItem[]; totalCount: number }> {
  const statusWhere = options.status
    ? eq(moderationReportTable.status, options.status)
    : undefined;

  const [countRow] = statusWhere
    ? await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(moderationReportTable)
        .where(statusWhere)
    : await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(moderationReportTable);
  const totalCount = countRow?.totalCount ?? 0;

  const base = db
    .select({
      id: moderationReportTable.id,
      targetType: moderationReportTable.targetType,
      targetId: moderationReportTable.targetId,
      reason: moderationReportTable.reason,
      status: moderationReportTable.status,
      createdAt: moderationReportTable.createdAt,
      reporterName: userTable.name,
      reporterUserId: moderationReportTable.reporterUserId,
    })
    .from(moderationReportTable)
    .leftJoin(
      userTable,
      eq(userTable.id, moderationReportTable.reporterUserId),
    );

  const reports = await (statusWhere ? base.where(statusWhere) : base)
    .orderBy(desc(moderationReportTable.createdAt))
    .limit(options.per)
    .offset((options.page - 1) * options.per);

  return {
    reports: reports.map((row) => ({
      ...row,
      targetType: row.targetType as ReportTargetType,
      status: row.status as ReportStatus,
    })),
    totalCount,
  };
}

export async function setReportStatus(
  reportId: string,
  status: Exclude<ReportStatus, "open">,
  resolverUserId: string,
): Promise<boolean> {
  const [row] = await db
    .update(moderationReportTable)
    .set({
      status,
      resolvedAt: new Date(),
      resolvedByUserId: resolverUserId,
    })
    .where(eq(moderationReportTable.id, reportId))
    .returning({ id: moderationReportTable.id });
  return Boolean(row);
}

export async function writeLog(data: {
  actorUserId: string;
  action: ModerationAction;
  targetType: string;
  targetId: string;
  details?: string | null;
}): Promise<void> {
  await db.insert(moderationLogTable).values({
    actorUserId: data.actorUserId,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    details: data.details ?? null,
  });
}

export async function listLogs(options: {
  page: number;
  per: number;
}): Promise<{ logs: ModerationLogItem[]; totalCount: number }> {
  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(moderationLogTable);
  const totalCount = countRow?.totalCount ?? 0;

  const logs = await db
    .select({
      id: moderationLogTable.id,
      action: moderationLogTable.action,
      targetType: moderationLogTable.targetType,
      targetId: moderationLogTable.targetId,
      details: moderationLogTable.details,
      createdAt: moderationLogTable.createdAt,
      actorName: userTable.name,
    })
    .from(moderationLogTable)
    .leftJoin(userTable, eq(userTable.id, moderationLogTable.actorUserId))
    .orderBy(desc(moderationLogTable.createdAt))
    .limit(options.per)
    .offset((options.page - 1) * options.per);

  return { logs, totalCount };
}

export async function getOverview(): Promise<ModerationOverview> {
  const [openReports, bannedUsers, lockedThreads, deletedThreads] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(moderationReportTable)
        .where(eq(moderationReportTable.status, "open")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userTable)
        .where(isNotNull(userTable.bannedAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(threadTable)
        .where(
          and(eq(threadTable.isLocked, true), isNull(threadTable.deletedAt)),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(threadTable)
        .where(isNotNull(threadTable.deletedAt)),
    ]);

  return {
    openReports: openReports[0]?.count ?? 0,
    bannedUsers: bannedUsers[0]?.count ?? 0,
    lockedThreads: lockedThreads[0]?.count ?? 0,
    deletedThreads: deletedThreads[0]?.count ?? 0,
  };
}
