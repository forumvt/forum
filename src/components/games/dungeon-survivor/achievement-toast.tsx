"use client";

import { toast } from "sonner";

import type { UnlockedAchievement } from "@/types/achievement";

export function toastAchievementUnlocked(achievement: UnlockedAchievement) {
  toast.success("Conquista desbloqueada!", {
    description: `${achievement.icon} ${achievement.name} — ${achievement.description}${
      achievement.rewardXp > 0 ? ` (+${achievement.rewardXp} XP)` : ""
    }`,
    duration: 4500,
  });
}
