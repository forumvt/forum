export const GAME_EVENT_TYPES = [
  "game_started",
  "enemy_killed",
  "damage_taken",
  "coin_collected",
  "chest_opened",
  "wave_completed",
  "player_died",
  "game_completed",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export const XP_REWARDS: Record<GameEventType, number> = {
  game_started: 5,
  enemy_killed: 1,
  damage_taken: 0,
  coin_collected: 0,
  chest_opened: 5,
  wave_completed: 10,
  player_died: 0,
  game_completed: 50,
};

export const RUN_CAPS = {
  maxEnemiesKilled: 200,
  maxCoinsCollected: 500,
  maxChestsOpened: 50,
  maxWave: 50,
  maxXpPerRun: 800,
} as const;

export const DUNGEON_SURVIVOR_SLUG = "dungeon-survivor";
