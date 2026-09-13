import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/abuse-guard", () => ({
  isStaffUser: vi.fn(async () => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/services/moderation.service", () => ({
  getWriteBlock: vi.fn(async () => ({ blocked: false })),
}));

vi.mock("@/repositories/game-run.repository", () => ({
  findById: vi.fn(),
  updateRun: vi.fn(),
  createRun: vi.fn(),
  findActiveForUser: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  getXp: vi.fn(async () => 0),
  addXp: vi.fn(),
}));

vi.mock("@/services/xp.service", () => ({
  awardXp: vi.fn(async (_userId: string, amount: number) => ({
    xpGained: amount,
    totalXp: 100 + amount,
    level: 2,
  })),
  getXpStats: vi.fn(),
}));

vi.mock("@/services/achievement.service", () => ({
  applyCounterEvent: vi.fn(async () => []),
  applyStateProgress: vi.fn(async () => null),
}));

import * as gameRunRepo from "@/repositories/game-run.repository";
import * as userRepo from "@/repositories/user.repository";
import * as achievementService from "@/services/achievement.service";
import * as gameEventService from "@/services/game-event.service";
import * as xpService from "@/services/xp.service";

function activeRun(overrides: Partial<Awaited<ReturnType<typeof gameRunRepo.findById>>> = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "u1",
    gameSlug: "dungeon-survivor",
    status: "active" as const,
    wave: 0,
    killStreakNoDamage: 0,
    damageTakenThisWave: false,
    enemiesKilled: 0,
    coinsCollected: 0,
    chestsOpened: 0,
    gameStartedCounted: false,
    xpAwardedThisRun: 0,
    startedAt: new Date(),
    endedAt: null,
    ...overrides,
  };
}

describe("game-event.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid event type", async () => {
    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: "11111111-1111-1111-1111-111111111111",
      type: "hack_xp",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_event");
  });

  it("rejects missing run", async () => {
    vi.mocked(gameRunRepo.findById).mockResolvedValue(null);
    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: "11111111-1111-1111-1111-111111111111",
      type: "enemy_killed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("not_found");
  });

  it("rejects run owned by another user", async () => {
    vi.mocked(gameRunRepo.findById).mockResolvedValue(activeRun({ userId: "other" }));
    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: "11111111-1111-1111-1111-111111111111",
      type: "enemy_killed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("forbidden");
  });

  it("rejects events on ended run", async () => {
    vi.mocked(gameRunRepo.findById).mockResolvedValue(
      activeRun({ status: "ended" }),
    );
    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: "11111111-1111-1111-1111-111111111111",
      type: "enemy_killed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("run_ended");
  });

  it("awards server-side XP for enemy_killed", async () => {
    const run = activeRun();
    vi.mocked(gameRunRepo.findById).mockResolvedValue(run);
    vi.mocked(gameRunRepo.updateRun).mockImplementation(async (_id, patch) => ({
      ...run,
      ...patch,
      enemiesKilled: (patch.enemiesKilled as number) ?? run.enemiesKilled,
      killStreakNoDamage:
        (patch.killStreakNoDamage as number) ?? run.killStreakNoDamage,
      xpAwardedThisRun:
        (patch.xpAwardedThisRun as number) ?? run.xpAwardedThisRun,
    }));
    vi.mocked(userRepo.getXp).mockResolvedValue(101);
    vi.mocked(achievementService.applyCounterEvent).mockResolvedValue([]);
    vi.mocked(achievementService.applyStateProgress).mockResolvedValue(null);

    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: run.id,
      type: "enemy_killed",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.xpGained).toBe(1);
      expect(xpService.awardXp).toHaveBeenCalledWith("u1", 1);
    }
  });

  it("does not accept client XP amounts (only event type)", async () => {
    const run = activeRun({ gameStartedCounted: false });
    vi.mocked(gameRunRepo.findById).mockResolvedValue(run);
    vi.mocked(gameRunRepo.updateRun).mockResolvedValue({
      ...run,
      gameStartedCounted: true,
    });
    vi.mocked(userRepo.getXp).mockResolvedValue(5);
    vi.mocked(achievementService.applyCounterEvent).mockResolvedValue([]);

    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: run.id,
      type: "game_started",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.xpGained).toBe(5);
      expect(xpService.awardXp).toHaveBeenCalledWith("u1", 5);
    }
  });

  it("unlocks intocavel on wave_completed without damage", async () => {
    const run = activeRun({ damageTakenThisWave: false, wave: 1 });
    vi.mocked(gameRunRepo.findById).mockResolvedValue(run);
    vi.mocked(gameRunRepo.updateRun).mockResolvedValue({
      ...run,
      wave: 2,
      damageTakenThisWave: false,
    });
    vi.mocked(userRepo.getXp).mockResolvedValue(20);
    vi.mocked(achievementService.applyCounterEvent).mockResolvedValue([]);
    vi.mocked(achievementService.applyStateProgress).mockResolvedValue({
      id: "intocavel",
      name: "Intocável",
      description: "Complete uma wave sem receber dano.",
      icon: "💯",
      rewardXp: 150,
    });

    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: run.id,
      type: "wave_completed",
    });

    expect(result.ok).toBe(true);
    expect(achievementService.applyStateProgress).toHaveBeenCalledWith(
      "u1",
      "intocavel",
      1,
    );
    if (result.ok) {
      expect(result.unlockedAchievements.some((a) => a.id === "intocavel")).toBe(
        true,
      );
    }
  });

  it("does not unlock intocavel if damage was taken this wave", async () => {
    const run = activeRun({ damageTakenThisWave: true, wave: 1 });
    vi.mocked(gameRunRepo.findById).mockResolvedValue(run);
    vi.mocked(gameRunRepo.updateRun).mockResolvedValue({
      ...run,
      wave: 2,
      damageTakenThisWave: false,
    });
    vi.mocked(userRepo.getXp).mockResolvedValue(20);
    vi.mocked(achievementService.applyCounterEvent).mockResolvedValue([]);

    await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: run.id,
      type: "wave_completed",
    });

    expect(achievementService.applyStateProgress).not.toHaveBeenCalledWith(
      "u1",
      "intocavel",
      1,
    );
  });

  it("ignores duplicate game_started on same run", async () => {
    const run = activeRun({ gameStartedCounted: true });
    vi.mocked(gameRunRepo.findById).mockResolvedValue(run);
    vi.mocked(userRepo.getXp).mockResolvedValue(5);

    const result = await gameEventService.processDungeonEvent({
      userId: "u1",
      runId: run.id,
      type: "game_started",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.xpGained).toBe(0);
    }
    expect(xpService.awardXp).not.toHaveBeenCalled();
  });
});
