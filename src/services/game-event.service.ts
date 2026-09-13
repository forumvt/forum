import { isStaffUser } from "@/lib/abuse-guard";
import { levelFromXp } from "@/lib/games/level";
import {
  DUNGEON_SURVIVOR_SLUG,
  GAME_EVENT_TYPES,
  type GameEventType,
  RUN_CAPS,
  XP_REWARDS,
} from "@/lib/games/xp-rewards";
import { checkRateLimit, type WriteAbuseError } from "@/lib/rate-limit";
import type { GameRunRow } from "@/repositories/game-run.repository";
import * as gameRunRepo from "@/repositories/game-run.repository";
import * as userRepo from "@/repositories/user.repository";
import * as achievementService from "@/services/achievement.service";
import * as moderationService from "@/services/moderation.service";
import * as xpService from "@/services/xp.service";
import type { UnlockedAchievement } from "@/types/achievement";

export type GameEventError =
  | "unauthorized"
  | "banned"
  | "not_found"
  | "invalid_event"
  | "run_ended"
  | "forbidden"
  | "cap_reached"
  | WriteAbuseError;

export type StartRunResult =
  | { ok: true; runId: string }
  | {
      ok: false;
      error: GameEventError;
      reason?: string | null;
      retryAfterSeconds?: number;
    };

export type ProcessEventResult =
  | {
      ok: true;
      xpGained: number;
      totalXp: number;
      level: number;
      unlockedAchievements: UnlockedAchievement[];
    }
  | {
      ok: false;
      error: GameEventError;
      reason?: string | null;
      retryAfterSeconds?: number;
    };

export function isGameEventType(value: string): value is GameEventType {
  return (GAME_EVENT_TYPES as readonly string[]).includes(value);
}

export async function startDungeonRun(
  userId: string,
): Promise<StartRunResult> {
  const block = await moderationService.getWriteBlock(userId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  if (!(await isStaffUser(userId))) {
    const rate = await checkRateLimit("gameRunStart", userId);
    if (!rate.ok) {
      return {
        ok: false,
        error: rate.error,
        retryAfterSeconds: rate.retryAfterSeconds,
      };
    }
  }

  const existing = await gameRunRepo.findActiveForUser(
    userId,
    DUNGEON_SURVIVOR_SLUG,
  );
  if (existing) {
    await gameRunRepo.updateRun(existing.id, {
      status: "ended",
      endedAt: new Date(),
    });
  }

  const run = await gameRunRepo.createRun({
    userId,
    gameSlug: DUNGEON_SURVIVOR_SLUG,
  });

  return { ok: true, runId: run.id };
}

function canAwardEventXp(run: GameRunRow, type: GameEventType): boolean {
  if (run.xpAwardedThisRun >= RUN_CAPS.maxXpPerRun) return false;
  switch (type) {
    case "game_started":
      return !run.gameStartedCounted;
    case "enemy_killed":
      return run.enemiesKilled < RUN_CAPS.maxEnemiesKilled;
    case "coin_collected":
      return run.coinsCollected < RUN_CAPS.maxCoinsCollected;
    case "chest_opened":
      return run.chestsOpened < RUN_CAPS.maxChestsOpened;
    case "wave_completed":
      return run.wave < RUN_CAPS.maxWave;
    default:
      return true;
  }
}

async function applyRunMutations(
  run: GameRunRow,
  type: GameEventType,
): Promise<{ run: GameRunRow; accepted: boolean; skipReason?: "cap_reached" }> {
  if (!canAwardEventXp(run, type) && type !== "damage_taken") {
    // damage_taken always accepted for streak reset; capped events rejected
    if (
      type === "game_started" ||
      type === "enemy_killed" ||
      type === "coin_collected" ||
      type === "chest_opened" ||
      type === "wave_completed"
    ) {
      return { run, accepted: false, skipReason: "cap_reached" };
    }
  }

  const patch: Parameters<typeof gameRunRepo.updateRun>[1] = {};

  switch (type) {
    case "game_started":
      if (run.gameStartedCounted) {
        return { run, accepted: false, skipReason: "cap_reached" };
      }
      patch.gameStartedCounted = true;
      break;
    case "enemy_killed":
      if (run.enemiesKilled >= RUN_CAPS.maxEnemiesKilled) {
        return { run, accepted: false, skipReason: "cap_reached" };
      }
      patch.enemiesKilled = run.enemiesKilled + 1;
      patch.killStreakNoDamage = run.killStreakNoDamage + 1;
      break;
    case "damage_taken":
      patch.damageTakenThisWave = true;
      patch.killStreakNoDamage = 0;
      break;
    case "coin_collected":
      if (run.coinsCollected >= RUN_CAPS.maxCoinsCollected) {
        return { run, accepted: false, skipReason: "cap_reached" };
      }
      patch.coinsCollected = run.coinsCollected + 1;
      break;
    case "chest_opened":
      if (run.chestsOpened >= RUN_CAPS.maxChestsOpened) {
        return { run, accepted: false, skipReason: "cap_reached" };
      }
      patch.chestsOpened = run.chestsOpened + 1;
      break;
    case "wave_completed": {
      if (run.wave >= RUN_CAPS.maxWave) {
        return { run, accepted: false, skipReason: "cap_reached" };
      }
      const nextWave = run.wave + 1;
      patch.wave = nextWave;
      patch.damageTakenThisWave = false;
      break;
    }
    case "player_died":
    case "game_completed":
      patch.status = "ended";
      patch.endedAt = new Date();
      break;
    default:
      break;
  }

  const updated = await gameRunRepo.updateRun(run.id, patch);
  return { run: updated ?? run, accepted: true };
}

export async function processDungeonEvent(params: {
  userId: string;
  runId: string;
  type: string;
}): Promise<ProcessEventResult> {
  const block = await moderationService.getWriteBlock(params.userId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  if (!(await isStaffUser(params.userId))) {
    const rate = await checkRateLimit("gameEvent", params.userId);
    if (!rate.ok) {
      return {
        ok: false,
        error: rate.error,
        retryAfterSeconds: rate.retryAfterSeconds,
      };
    }
  }

  if (!isGameEventType(params.type)) {
    return { ok: false, error: "invalid_event" };
  }

  const run = await gameRunRepo.findById(params.runId);
  if (!run || run.gameSlug !== DUNGEON_SURVIVOR_SLUG) {
    return { ok: false, error: "not_found" };
  }
  if (run.userId !== params.userId) {
    return { ok: false, error: "forbidden" };
  }
  if (run.status !== "active") {
    return { ok: false, error: "run_ended" };
  }

  const type = params.type;
  const beforeWaveDamage = run.damageTakenThisWave;
  const { run: nextRun, accepted, skipReason } = await applyRunMutations(
    run,
    type,
  );

  if (!accepted) {
    const totalXp = await userRepo.getXp(params.userId);
    return {
      ok: true,
      xpGained: 0,
      totalXp,
      level: levelFromXp(totalXp),
      unlockedAchievements: [],
      ...(skipReason ? {} : {}),
    };
  }

  let xpGained = 0;
  const unlockedAchievements: UnlockedAchievement[] = [];

  const baseXp = XP_REWARDS[type];
  const remainingCap = RUN_CAPS.maxXpPerRun - nextRun.xpAwardedThisRun;
  const award = Math.min(baseXp, Math.max(0, remainingCap));

  if (award > 0) {
    const xpResult = await xpService.awardXp(params.userId, award);
    xpGained += xpResult.xpGained;
    await gameRunRepo.updateRun(nextRun.id, {
      xpAwardedThisRun: nextRun.xpAwardedThisRun + xpResult.xpGained,
    });
  }

  if (
    type === "game_started" ||
    type === "enemy_killed" ||
    type === "coin_collected" ||
    type === "chest_opened" ||
    type === "wave_completed" ||
    type === "player_died"
  ) {
    const counterUnlocks = await achievementService.applyCounterEvent(
      params.userId,
      type,
      1,
    );
    unlockedAchievements.push(...counterUnlocks);
  }

  if (type === "enemy_killed") {
    const massacre = await achievementService.applyStateProgress(
      params.userId,
      "massacre",
      nextRun.killStreakNoDamage,
    );
    if (massacre) unlockedAchievements.push(massacre);
  }

  if (type === "wave_completed" && !beforeWaveDamage) {
    const intocavel = await achievementService.applyStateProgress(
      params.userId,
      "intocavel",
      1,
    );
    if (intocavel) unlockedAchievements.push(intocavel);
  }

  const totalXp = await userRepo.getXp(params.userId);
  return {
    ok: true,
    xpGained,
    totalXp,
    level: levelFromXp(totalXp),
    unlockedAchievements,
  };
}

export function listGamesCatalog() {
  return [
    {
      slug: DUNGEON_SURVIVOR_SLUG,
      title: "Dungeon Survivor",
      description:
        "Sobreviva às waves, colete moedas e desbloqueie conquistas.",
      href: `/jogos/${DUNGEON_SURVIVOR_SLUG}`,
      icon: "🏰",
    },
  ];
}
