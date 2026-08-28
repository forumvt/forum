import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  pmConversationTable,
  pmMessageTable,
  pmParticipantTable,
  userTable,
} from "@/db/schema";
import type { PmPerson } from "@/types/pm";

export function orderedPair(
  userA: string,
  userB: string,
): { low: string; high: string } {
  return userA < userB
    ? { low: userA, high: userB }
    : { low: userB, high: userA };
}

export async function findConversationIdByPair(
  userA: string,
  userB: string,
): Promise<string | null> {
  const { low, high } = orderedPair(userA, userB);
  const [row] = await db
    .select({ id: pmConversationTable.id })
    .from(pmConversationTable)
    .where(
      and(
        eq(pmConversationTable.userLowId, low),
        eq(pmConversationTable.userHighId, high),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function findConversationMeta(conversationId: string): Promise<{
  id: string;
} | null> {
  const [row] = await db
    .select({ id: pmConversationTable.id })
    .from(pmConversationTable)
    .where(eq(pmConversationTable.id, conversationId))
    .limit(1);
  return row ?? null;
}

export async function isParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ userId: pmParticipantTable.userId })
    .from(pmParticipantTable)
    .where(
      and(
        eq(pmParticipantTable.conversationId, conversationId),
        eq(pmParticipantTable.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function countParticipants(
  conversationId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pmParticipantTable)
    .where(eq(pmParticipantTable.conversationId, conversationId));
  return row?.count ?? 0;
}

export async function findParticipantIds(
  conversationId: string,
): Promise<string[]> {
  const rows = await db
    .select({ userId: pmParticipantTable.userId })
    .from(pmParticipantTable)
    .where(eq(pmParticipantTable.conversationId, conversationId));
  return rows.map((row) => row.userId);
}

export async function findParticipants(
  conversationId: string,
): Promise<PmPerson[]> {
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
    })
    .from(pmParticipantTable)
    .innerJoin(userTable, eq(userTable.id, pmParticipantTable.userId))
    .where(eq(pmParticipantTable.conversationId, conversationId))
    .orderBy(userTable.name);
  return rows;
}

export async function findParticipantsByConversationIds(
  conversationIds: string[],
): Promise<Map<string, PmPerson[]>> {
  const map = new Map<string, PmPerson[]>();
  if (conversationIds.length === 0) return map;

  const rows = await db
    .select({
      conversationId: pmParticipantTable.conversationId,
      id: userTable.id,
      name: userTable.name,
      avatar: userTable.image,
    })
    .from(pmParticipantTable)
    .innerJoin(userTable, eq(userTable.id, pmParticipantTable.userId))
    .where(inArray(pmParticipantTable.conversationId, conversationIds))
    .orderBy(userTable.name);

  for (const row of rows) {
    const list = map.get(row.conversationId) ?? [];
    list.push({ id: row.id, name: row.name, avatar: row.avatar });
    map.set(row.conversationId, list);
  }
  return map;
}

export async function createConversation(userIds: string[]): Promise<string> {
  const unique = [...new Set(userIds.filter(Boolean))];
  return db.transaction(async (tx) => {
    const values =
      unique.length === 2
        ? orderedPair(unique[0], unique[1])
        : { low: null, high: null };
    const [created] = await tx
      .insert(pmConversationTable)
      .values({
        userLowId: values.low,
        userHighId: values.high,
      })
      .returning({ id: pmConversationTable.id });
    await tx.insert(pmParticipantTable).values(
      unique.map((userId) => ({
        conversationId: created.id,
        userId,
      })),
    );
    return created.id;
  });
}

export async function addParticipants(
  conversationId: string,
  userIds: string[],
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;
  await db.transaction(async (tx) => {
    await tx
      .insert(pmParticipantTable)
      .values(
        unique.map((userId) => ({
          conversationId,
          userId,
        })),
      )
      .onConflictDoNothing();
    const [countRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(pmParticipantTable)
      .where(eq(pmParticipantTable.conversationId, conversationId));
    if ((countRow?.count ?? 0) > 2) {
      await tx
        .update(pmConversationTable)
        .set({ userLowId: null, userHighId: null })
        .where(eq(pmConversationTable.id, conversationId));
    }
  });
}

export async function insertMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  preview: string;
}): Promise<{ id: string; createdAt: Date }> {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(pmMessageTable)
      .values({
        conversationId: params.conversationId,
        senderId: params.senderId,
        content: params.content,
      })
      .returning({
        id: pmMessageTable.id,
        createdAt: pmMessageTable.createdAt,
      });
    await tx
      .update(pmConversationTable)
      .set({
        lastMessageAt: now,
        lastMessagePreview: params.preview,
      })
      .where(eq(pmConversationTable.id, params.conversationId));
    await tx
      .update(pmParticipantTable)
      .set({ lastReadAt: now })
      .where(
        and(
          eq(pmParticipantTable.conversationId, params.conversationId),
          eq(pmParticipantTable.userId, params.senderId),
        ),
      );
    return created;
  });
}

export async function markRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await db
    .update(pmParticipantTable)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(pmParticipantTable.conversationId, conversationId),
        eq(pmParticipantTable.userId, userId),
      ),
    );
}

export async function listInbox(
  userId: string,
  page: number,
  per: number,
): Promise<{
  conversations: Array<{
    id: string;
    lastMessageAt: Date;
    lastMessagePreview: string | null;
    lastReadAt: Date | null;
  }>;
  totalCount: number;
}> {
  const me = alias(pmParticipantTable, "pm_me");
  const hasMessages = sql`exists (select 1 from "pm_message" where "pm_message"."conversation_id" = ${pmConversationTable.id})`;

  const [countRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(me)
    .innerJoin(
      pmConversationTable,
      eq(me.conversationId, pmConversationTable.id),
    )
    .where(and(eq(me.userId, userId), hasMessages));
  const totalCount = countRow?.totalCount ?? 0;

  const conversations = await db
    .select({
      id: pmConversationTable.id,
      lastMessageAt: pmConversationTable.lastMessageAt,
      lastMessagePreview: pmConversationTable.lastMessagePreview,
      lastReadAt: me.lastReadAt,
    })
    .from(me)
    .innerJoin(
      pmConversationTable,
      eq(me.conversationId, pmConversationTable.id),
    )
    .where(and(eq(me.userId, userId), hasMessages))
    .orderBy(desc(pmConversationTable.lastMessageAt))
    .limit(per)
    .offset((page - 1) * per);

  return { conversations, totalCount };
}

export async function countUnread(userId: string): Promise<number> {
  const me = alias(pmParticipantTable, "pm_unread_me");
  const hasMessages = sql`exists (select 1 from "pm_message" where "pm_message"."conversation_id" = ${pmConversationTable.id})`;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(me)
    .innerJoin(
      pmConversationTable,
      eq(me.conversationId, pmConversationTable.id),
    )
    .where(
      and(
        eq(me.userId, userId),
        hasMessages,
        sql`${pmConversationTable.lastMessageAt} > coalesce(${me.lastReadAt}, timestamp '1970-01-01')`,
      ),
    );
  return row?.count ?? 0;
}

export async function findMessages(
  conversationId: string,
  viewerId: string,
  limit = 100,
): Promise<
  Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    createdAt: Date;
    mine: boolean;
  }>
> {
  const rows = await db
    .select({
      id: pmMessageTable.id,
      senderId: pmMessageTable.senderId,
      senderName: userTable.name,
      senderAvatar: userTable.image,
      content: pmMessageTable.content,
      createdAt: pmMessageTable.createdAt,
    })
    .from(pmMessageTable)
    .innerJoin(userTable, eq(userTable.id, pmMessageTable.senderId))
    .where(eq(pmMessageTable.conversationId, conversationId))
    .orderBy(desc(pmMessageTable.createdAt))
    .limit(limit);

  return rows.reverse().map((row) => ({
    ...row,
    mine: row.senderId === viewerId,
  }));
}
