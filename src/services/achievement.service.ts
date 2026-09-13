import type { AchievementRow } from "@/repositories/achievement.repository";
import * as achievementRepo from "@/repositories/achievement.repository";
import * as xpService from "@/services/xp.service";
import type {
  AchievementProgressView,
  UnlockedAchievement,
} from "@/types/achievement";

export type { AchievementProgressView, UnlockedAchievement };

export async function listCatalog(): Promise<AchievementRow[]> {
  return achievementRepo.listAchievements();
}

export async function listForUser(
  userId: string,
): Promise<AchievementProgressView[]> {
  const [catalog, progressRows] = await Promise.all([
    achievementRepo.listAchievements(),
    achievementRepo.listUserAchievements(userId),
  ]);
  const byId = new Map(progressRows.map((row) => [row.achievementId, row]));

  return catalog.map((achievement) => {
    const progress = byId.get(achievement.id);
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      target: achievement.target,
      progress: progress?.progress ?? 0,
      unlocked: Boolean(progress?.unlockedAt),
      unlockedAt: progress?.unlockedAt?.toISOString() ?? null,
      rewardXp: achievement.rewardXp,
    };
  });
}

export async function countUnlocked(userId: string): Promise<number> {
  return achievementRepo.countUnlocked(userId);
}

async function unlockIfReady(
  userId: string,
  achievement: AchievementRow,
  progress: number,
): Promise<UnlockedAchievement | null> {
  if (progress < achievement.target) {
    await achievementRepo.upsertProgress({
      userId,
      achievementId: achievement.id,
      progress,
    });
    return null;
  }

  const { unlocked } = await achievementRepo.tryUnlock({
    userId,
    achievementId: achievement.id,
    progress: Math.max(progress, achievement.target),
  });

  if (!unlocked) return null;

  if (achievement.rewardXp > 0) {
    await xpService.awardXp(userId, achievement.rewardXp);
  }

  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    rewardXp: achievement.rewardXp,
  };
}

/** Increment counter achievements tied to a game event. */
export async function applyCounterEvent(
  userId: string,
  event: string,
  increment = 1,
): Promise<UnlockedAchievement[]> {
  const achievements = await achievementRepo.findAchievementsByEvent(event);
  const unlocked: UnlockedAchievement[] = [];

  for (const achievement of achievements) {
    if (achievement.kind !== "counter") continue;
    const existing = await achievementRepo.findUserAchievement(
      userId,
      achievement.id,
    );
    if (existing?.unlockedAt) continue;

    const nextProgress = (existing?.progress ?? 0) + increment;
    const result = await unlockIfReady(userId, achievement, nextProgress);
    if (result) unlocked.push(result);
  }

  return unlocked;
}

/** Set absolute progress for a state achievement (e.g. kill streak). */
export async function applyStateProgress(
  userId: string,
  achievementId: string,
  progress: number,
): Promise<UnlockedAchievement | null> {
  const achievement = await achievementRepo.findAchievementById(achievementId);
  if (!achievement || achievement.kind !== "state") return null;

  const existing = await achievementRepo.findUserAchievement(
    userId,
    achievement.id,
  );
  if (existing?.unlockedAt) return null;

  const next = Math.max(existing?.progress ?? 0, progress);
  return unlockIfReady(userId, achievement, next);
}
