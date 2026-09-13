import type { GameEventType } from "@/lib/games/xp-rewards";
import type { UnlockedAchievement } from "@/types/achievement";

export interface EventSyncResult {
  xpGained: number;
  totalXp: number;
  level: number;
  unlockedAchievements: UnlockedAchievement[];
}

export async function startRun(): Promise<{ runId: string } | null> {
  const res = await fetch("/api/games/dungeon-survivor/runs", {
    method: "POST",
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { runId: string };
  return { runId: data.runId };
}

export async function postEvent(
  runId: string,
  type: GameEventType,
  data?: Record<string, unknown>,
): Promise<EventSyncResult | null> {
  const res = await fetch("/api/games/dungeon-survivor/events", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, type, data }),
  });
  if (!res.ok) return null;
  return (await res.json()) as EventSyncResult;
}
