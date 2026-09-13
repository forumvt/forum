export interface UnlockedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewardXp: number;
}

export interface AchievementProgressView {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
  rewardXp: number;
}
