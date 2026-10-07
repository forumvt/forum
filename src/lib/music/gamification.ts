import * as xpService from "@/services/xp.service";
import type { MusicXpAction } from "@/types/music";

/**
 * Camada fina de music XP — reutiliza o XP global do fórum.
 * Conquistas específicas (Primeiro DJ, 10 músicas, etc.) ficam para evolução.
 */
const XP_BY_ACTION: Record<MusicXpAction, number> = {
  music_chat: 1,
  music_reaction: 1,
  music_queue_join: 2,
  music_dj_song: 5,
  music_first_dj: 15,
};

export async function awardMusicXp(
  userId: string,
  action: MusicXpAction,
): Promise<{ xpGained: number; totalXp: number; level: number }> {
  const amount = XP_BY_ACTION[action] ?? 0;
  return xpService.awardXp(userId, amount);
}

export function musicXpPreview(action: MusicXpAction): number {
  return XP_BY_ACTION[action] ?? 0;
}
