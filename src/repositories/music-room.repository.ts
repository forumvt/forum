import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { musicRoomHistoryTable, musicRoomTable } from "@/db/schema";

export type MusicRoomRow = typeof musicRoomTable.$inferSelect;

export async function listActiveRooms(): Promise<MusicRoomRow[]> {
  return db
    .select()
    .from(musicRoomTable)
    .where(eq(musicRoomTable.isActive, true))
    .orderBy(desc(musicRoomTable.createdAt));
}

export async function findById(id: string): Promise<MusicRoomRow | null> {
  const [row] = await db
    .select()
    .from(musicRoomTable)
    .where(eq(musicRoomTable.id, id))
    .limit(1);
  return row ?? null;
}

export async function findBySlug(slug: string): Promise<MusicRoomRow | null> {
  const [row] = await db
    .select()
    .from(musicRoomTable)
    .where(eq(musicRoomTable.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function createRoom(input: {
  name: string;
  slug: string;
  description?: string | null;
  createdByUserId: string;
  isPrivate?: boolean;
}): Promise<MusicRoomRow> {
  const [row] = await db
    .insert(musicRoomTable)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      createdByUserId: input.createdByUserId,
      isPrivate: input.isPrivate ?? false,
    })
    .returning();
  return row!;
}

export async function insertHistory(input: {
  roomId: string;
  songId: string;
  title: string;
  artist: string;
  source: string;
  duration: number;
  djUserId: string | null;
}): Promise<void> {
  await db.insert(musicRoomHistoryTable).values(input);
}

export async function countRoomsByCreator(userId: string): Promise<number> {
  const rows = await db
    .select({ id: musicRoomTable.id })
    .from(musicRoomTable)
    .where(
      and(
        eq(musicRoomTable.createdByUserId, userId),
        eq(musicRoomTable.isActive, true),
      ),
    );
  return rows.length;
}
