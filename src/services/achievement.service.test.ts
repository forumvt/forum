import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/repositories/achievement.repository", () => ({
  findAchievementsByEvent: vi.fn(),
  findUserAchievement: vi.fn(),
  findAchievementById: vi.fn(),
  upsertProgress: vi.fn(),
  tryUnlock: vi.fn(),
  listAchievements: vi.fn(),
  listUserAchievements: vi.fn(),
  countUnlocked: vi.fn(),
}));

vi.mock("@/services/xp.service", () => ({
  awardXp: vi.fn(async (_userId: string, amount: number) => ({
    xpGained: amount,
    totalXp: amount,
    level: 1,
  })),
}));

import * as achievementRepo from "@/repositories/achievement.repository";
import * as achievementService from "@/services/achievement.service";
import * as xpService from "@/services/xp.service";

const guerreiro = {
  id: "guerreiro",
  name: "Guerreiro",
  description: "Derrote 100 inimigos.",
  icon: "⚔️",
  event: "enemy_killed",
  target: 100,
  rewardXp: 100,
  kind: "counter" as const,
  gameSlug: "dungeon-survivor",
};

const massacre = {
  id: "massacre",
  name: "Massacre",
  description: "Derrote 20 inimigos consecutivamente sem receber dano.",
  icon: "🔥",
  event: null,
  target: 20,
  rewardXp: 100,
  kind: "state" as const,
  gameSlug: "dungeon-survivor",
};

describe("achievement.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not unlock Guerreiro at 99 kills", async () => {
    vi.mocked(achievementRepo.findAchievementsByEvent).mockResolvedValue([
      guerreiro,
    ]);
    vi.mocked(achievementRepo.findUserAchievement).mockResolvedValue({
      id: "ua-1",
      userId: "u1",
      achievementId: "guerreiro",
      progress: 98,
      unlockedAt: null,
    });
    vi.mocked(achievementRepo.upsertProgress).mockResolvedValue({
      id: "ua-1",
      userId: "u1",
      achievementId: "guerreiro",
      progress: 99,
      unlockedAt: null,
    });

    const unlocked = await achievementService.applyCounterEvent(
      "u1",
      "enemy_killed",
      1,
    );

    expect(unlocked).toEqual([]);
    expect(achievementRepo.tryUnlock).not.toHaveBeenCalled();
    expect(xpService.awardXp).not.toHaveBeenCalled();
  });

  it("unlocks Guerreiro at 100 kills and awards XP once", async () => {
    vi.mocked(achievementRepo.findAchievementsByEvent).mockResolvedValue([
      guerreiro,
    ]);
    vi.mocked(achievementRepo.findUserAchievement).mockResolvedValue({
      id: "ua-1",
      userId: "u1",
      achievementId: "guerreiro",
      progress: 99,
      unlockedAt: null,
    });
    vi.mocked(achievementRepo.tryUnlock).mockResolvedValue({
      unlocked: true,
      row: {
        id: "ua-1",
        userId: "u1",
        achievementId: "guerreiro",
        progress: 100,
        unlockedAt: new Date(),
      },
    });

    const unlocked = await achievementService.applyCounterEvent(
      "u1",
      "enemy_killed",
      1,
    );

    expect(unlocked).toHaveLength(1);
    expect(unlocked[0]?.id).toBe("guerreiro");
    expect(xpService.awardXp).toHaveBeenCalledWith("u1", 100);
  });

  it("does not re-award XP when already unlocked", async () => {
    vi.mocked(achievementRepo.findAchievementsByEvent).mockResolvedValue([
      guerreiro,
    ]);
    vi.mocked(achievementRepo.findUserAchievement).mockResolvedValue({
      id: "ua-1",
      userId: "u1",
      achievementId: "guerreiro",
      progress: 100,
      unlockedAt: new Date(),
    });

    const unlocked = await achievementService.applyCounterEvent(
      "u1",
      "enemy_killed",
      1,
    );

    expect(unlocked).toEqual([]);
    expect(achievementRepo.tryUnlock).not.toHaveBeenCalled();
    expect(xpService.awardXp).not.toHaveBeenCalled();
  });

  it("unlocks Massacre state achievement at streak 20", async () => {
    vi.mocked(achievementRepo.findAchievementById).mockResolvedValue(massacre);
    vi.mocked(achievementRepo.findUserAchievement).mockResolvedValue(null);
    vi.mocked(achievementRepo.tryUnlock).mockResolvedValue({
      unlocked: true,
      row: {
        id: "ua-2",
        userId: "u1",
        achievementId: "massacre",
        progress: 20,
        unlockedAt: new Date(),
      },
    });

    const result = await achievementService.applyStateProgress(
      "u1",
      "massacre",
      20,
    );

    expect(result?.id).toBe("massacre");
    expect(xpService.awardXp).toHaveBeenCalledWith("u1", 100);
  });

  it("does not unlock Massacre below target", async () => {
    vi.mocked(achievementRepo.findAchievementById).mockResolvedValue(massacre);
    vi.mocked(achievementRepo.findUserAchievement).mockResolvedValue({
      id: "ua-2",
      userId: "u1",
      achievementId: "massacre",
      progress: 10,
      unlockedAt: null,
    });
    vi.mocked(achievementRepo.upsertProgress).mockResolvedValue({
      id: "ua-2",
      userId: "u1",
      achievementId: "massacre",
      progress: 19,
      unlockedAt: null,
    });

    const result = await achievementService.applyStateProgress(
      "u1",
      "massacre",
      19,
    );

    expect(result).toBeNull();
    expect(achievementRepo.tryUnlock).not.toHaveBeenCalled();
  });
});
