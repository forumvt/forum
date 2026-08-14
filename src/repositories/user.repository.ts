import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";

export async function updateAvatar(
  userId: string,
  imageUrl: string,
): Promise<void> {
  await db
    .update(userTable)
    .set({ image: imageUrl })
    .where(eq(userTable.id, userId));
}

export async function findRoleById(
  userId: string,
): Promise<string | undefined> {
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return row?.role;
}
