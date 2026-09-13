import { levelFromXp } from "@/lib/games/level";
import * as userRepo from "@/repositories/user.repository";

export async function awardXp(
  userId: string,
  amount: number,
): Promise<{ xpGained: number; totalXp: number; level: number }> {
  const safe = Math.max(0, Math.floor(amount));
  if (safe === 0) {
    const totalXp = await userRepo.getXp(userId);
    return { xpGained: 0, totalXp, level: levelFromXp(totalXp) };
  }
  const totalXp = await userRepo.addXp(userId, safe);
  return { xpGained: safe, totalXp, level: levelFromXp(totalXp) };
}

export async function getXpStats(userId: string): Promise<{
  totalXp: number;
  level: number;
}> {
  const totalXp = await userRepo.getXp(userId);
  return { totalXp, level: levelFromXp(totalXp) };
}
