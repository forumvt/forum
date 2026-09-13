import type { GameEventType } from "@/lib/games/xp-rewards";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  attackCooldown: number;
  invuln: number;
}

export interface Enemy extends Entity {
  hp: number;
  speed: number;
  damage: number;
  kind: "goblin" | "slime";
}

export interface Pickup extends Entity {
  kind: "coin" | "chest";
  value: number;
}

export interface Projectile extends Entity {
  damage: number;
  life: number;
}

export type GamePhase = "ready" | "playing" | "dead";

export interface GameSnapshot {
  phase: GamePhase;
  wave: number;
  coins: number;
  hp: number;
  maxHp: number;
  enemiesAlive: number;
  sessionXpHint: number;
}

export interface GameEventPayload {
  type: GameEventType;
  data?: Record<string, unknown>;
}

export type GameEventListener = (event: GameEventPayload) => void;
