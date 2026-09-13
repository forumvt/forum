import type { GameEventType } from "@/lib/games/xp-rewards";

export type AchievementKind = "counter" | "state";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  event: GameEventType | null;
  target: number;
  rewardXp: number;
  kind: AchievementKind;
  gameSlug: string | null;
}

export const ACHIEVEMENTS_SEED: AchievementDefinition[] = [
  {
    id: "primeira-aventura",
    name: "Primeira aventura",
    description: "Inicie uma partida de Dungeon Survivor.",
    icon: "🐣",
    event: "game_started",
    target: 1,
    rewardXp: 25,
    kind: "counter",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "guerreiro",
    name: "Guerreiro",
    description: "Derrote 100 inimigos.",
    icon: "⚔️",
    event: "enemy_killed",
    target: 100,
    rewardXp: 100,
    kind: "counter",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "exterminador",
    name: "Exterminador",
    description: "Derrote 1000 inimigos.",
    icon: "💀",
    event: "enemy_killed",
    target: 1000,
    rewardXp: 500,
    kind: "counter",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "colecionador",
    name: "Colecionador",
    description: "Colete 100 moedas.",
    icon: "🪙",
    event: "coin_collected",
    target: 100,
    rewardXp: 50,
    kind: "counter",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "explorador",
    name: "Explorador",
    description: "Complete 10 waves.",
    icon: "🏰",
    event: "wave_completed",
    target: 10,
    rewardXp: 100,
    kind: "counter",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "foi-de-base",
    name: "Foi de base",
    description: "Morra pela primeira vez.",
    icon: "💀",
    event: "player_died",
    target: 1,
    rewardXp: 10,
    kind: "counter",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "intocavel",
    name: "Intocável",
    description: "Complete uma wave sem receber dano.",
    icon: "💯",
    event: null,
    target: 1,
    rewardXp: 150,
    kind: "state",
    gameSlug: "dungeon-survivor",
  },
  {
    id: "massacre",
    name: "Massacre",
    description: "Derrote 20 inimigos consecutivamente sem receber dano.",
    icon: "🔥",
    event: null,
    target: 20,
    rewardXp: 100,
    kind: "state",
    gameSlug: "dungeon-survivor",
  },
];
