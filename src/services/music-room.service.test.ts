import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import * as musicRoomService from "@/services/music-room.service";

describe("music-room.service realtime flow", () => {
  let roomId: string;
  let userA: string;
  let userB: string;

  beforeAll(async () => {
    const users = await db
      .select({ id: userTable.id, name: userTable.name })
      .from(userTable)
      .where(eq(userTable.role, "USER"))
      .limit(2);

    if (users.length < 2) {
      const any = await db.select({ id: userTable.id }).from(userTable).limit(2);
      userA = any[0]!.id;
      userB = any[1]?.id ?? any[0]!.id;
    } else {
      userA = users[0]!.id;
      userB = users[1]!.id;
    }

    const rooms = await musicRoomService.listRooms();
    roomId = rooms[0]!.id;
  });

  it("sincroniza presença, chat, fila e reação entre dois usuários", async () => {
    const joinA = await musicRoomService.joinRoom(roomId, userA);
    expect(joinA.ok).toBe(true);
    if (!joinA.ok) return;

    const joinB = await musicRoomService.joinRoom(roomId, userB);
    expect(joinB.ok).toBe(true);
    if (!joinB.ok) return;

    expect(joinB.state.users.some((u) => u.id === userA)).toBe(true);
    expect(joinB.state.users.some((u) => u.id === userB)).toBe(true);

    const chat = await musicRoomService.sendChat(
      roomId,
      userA,
      "essa é braba",
    );
    expect(chat.ok).toBe(true);
    if (!chat.ok) return;

    const stateB = await musicRoomService.getRoomState(roomId, userB);
    expect(stateB.ok).toBe(true);
    if (!stateB.ok) return;
    expect(stateB.state.chat.some((m) => m.message === "essa é braba")).toBe(
      true,
    );

    const queue = await musicRoomService.joinQueue(roomId, userB);
    expect(queue.ok).toBe(true);
    if (!queue.ok) return;

    const stateA = await musicRoomService.getRoomState(roomId, userA);
    expect(stateA.ok).toBe(true);
    if (!stateA.ok) return;

    const isDjOrQueued =
      stateA.state.playback.currentDj?.id === userB ||
      stateA.state.djQueue.some((q) => q.userId === userB);
    expect(isDjOrQueued).toBe(true);

    if (stateA.state.playback.currentSong) {
      const reaction = await musicRoomService.addReaction(
        roomId,
        userA,
        "fire",
      );
      expect(reaction.ok).toBe(true);
      if (reaction.ok) {
        expect(reaction.state.reactions.fire).toBeGreaterThan(0);
      }
    }

    const leave = await musicRoomService.leaveRoom(roomId, userB);
    expect(leave.ok).toBe(true);
    if (!leave.ok) return;
    expect(leave.state.users.some((u) => u.id === userB)).toBe(false);
  });
});
