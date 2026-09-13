import { GameEventBus } from "@/lib/games/dungeon-survivor/events";
import type {
  Enemy,
  GamePhase,
  GameSnapshot,
  Pickup,
  Player,
  Projectile,
  Vec2,
} from "@/lib/games/dungeon-survivor/types";

const ARENA_W = 720;
const ARENA_H = 420;
const PLAYER_SIZE = 22;
const ENEMY_SIZE = 18;

function aabb(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class DungeonEngine {
  readonly bus = new GameEventBus();
  readonly width = ARENA_W;
  readonly height = ARENA_H;

  phase: GamePhase = "ready";
  wave = 0;
  coins = 0;
  sessionXpHint = 0;

  player: Player;
  enemies: Enemy[] = [];
  pickups: Pickup[] = [];
  projectiles: Projectile[] = [];

  private nextId = 1;
  private keys = new Set<string>();
  private waveClearTimer = 0;
  private spawnPending = 0;
  private betweenWaves = false;

  constructor() {
    this.player = this.createPlayer();
  }

  private createPlayer(): Player {
    return {
      id: this.nextId++,
      x: ARENA_W / 2 - PLAYER_SIZE / 2,
      y: ARENA_H / 2 - PLAYER_SIZE / 2,
      w: PLAYER_SIZE,
      h: PLAYER_SIZE,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      speed: 180,
      attackCooldown: 0,
      invuln: 0,
    };
  }

  start(): void {
    this.phase = "playing";
    this.wave = 0;
    this.coins = 0;
    this.sessionXpHint = 0;
    this.enemies = [];
    this.pickups = [];
    this.projectiles = [];
    this.player = this.createPlayer();
    this.betweenWaves = false;
    this.waveClearTimer = 0;
    this.bus.emit({ type: "game_started" });
    this.beginWave(1);
  }

  private beginWave(n: number): void {
    this.wave = n;
    this.betweenWaves = false;
    this.spawnPending = 3 + n * 2;
    this.spawnWaveEnemies();
  }

  private spawnWaveEnemies(): void {
    const count = this.spawnPending;
    this.spawnPending = 0;
    for (let i = 0; i < count; i++) {
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (edge === 0) {
        x = rand(0, ARENA_W - ENEMY_SIZE);
        y = 8;
      } else if (edge === 1) {
        x = rand(0, ARENA_W - ENEMY_SIZE);
        y = ARENA_H - ENEMY_SIZE - 8;
      } else if (edge === 2) {
        x = 8;
        y = rand(0, ARENA_H - ENEMY_SIZE);
      } else {
        x = ARENA_W - ENEMY_SIZE - 8;
        y = rand(0, ARENA_H - ENEMY_SIZE);
      }
      const kind = Math.random() > 0.65 ? "slime" : "goblin";
      this.enemies.push({
        id: this.nextId++,
        x,
        y,
        w: ENEMY_SIZE,
        h: ENEMY_SIZE,
        vx: 0,
        vy: 0,
        hp: kind === "slime" ? 2 + Math.floor(this.wave / 2) : 1 + Math.floor(this.wave / 3),
        speed: kind === "slime" ? 55 + this.wave * 3 : 75 + this.wave * 4,
        damage: kind === "slime" ? 12 : 8,
        kind,
      });
    }
  }

  setKey(code: string, down: boolean): void {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
  }

  snapshot(): GameSnapshot {
    return {
      phase: this.phase,
      wave: this.wave,
      coins: this.coins,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      enemiesAlive: this.enemies.length,
      sessionXpHint: this.sessionXpHint,
    };
  }

  update(dt: number): void {
    if (this.phase !== "playing") return;

    const p = this.player;
    let mx = 0;
    let my = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my) || 1;
      p.vx = (mx / len) * p.speed;
      p.vy = (my / len) * p.speed;
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    p.x = clamp(p.x + p.vx * dt, 0, ARENA_W - p.w);
    p.y = clamp(p.y + p.vy * dt, 0, ARENA_H - p.h);

    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.invuln > 0) p.invuln -= dt;

    if (p.attackCooldown <= 0 && this.enemies.length > 0) {
      this.fireAtNearest();
      p.attackCooldown = 0.35;
    }

    for (const enemy of this.enemies) {
      const dx = p.x + p.w / 2 - (enemy.x + enemy.w / 2);
      const dy = p.y + p.h / 2 - (enemy.y + enemy.h / 2);
      const len = Math.hypot(dx, dy) || 1;
      enemy.vx = (dx / len) * enemy.speed;
      enemy.vy = (dy / len) * enemy.speed;
      enemy.x = clamp(enemy.x + enemy.vx * dt, 0, ARENA_W - enemy.w);
      enemy.y = clamp(enemy.y + enemy.vy * dt, 0, ARENA_H - enemy.h);

      if (p.invuln <= 0 && aabb(p, enemy)) {
        p.hp -= enemy.damage;
        p.invuln = 0.6;
        this.bus.emit({ type: "damage_taken", data: { amount: enemy.damage } });
        if (p.hp <= 0) {
          p.hp = 0;
          this.phase = "dead";
          this.bus.emit({ type: "player_died" });
          return;
        }
      }
    }

    for (const proj of this.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
    }

    for (const proj of [...this.projectiles]) {
      for (const enemy of [...this.enemies]) {
        if (!aabb(proj, enemy)) continue;
        enemy.hp -= proj.damage;
        this.projectiles = this.projectiles.filter((x) => x.id !== proj.id);
        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
        }
        break;
      }
    }

    this.projectiles = this.projectiles.filter(
      (proj) =>
        proj.life > 0 &&
        proj.x > -20 &&
        proj.y > -20 &&
        proj.x < ARENA_W + 20 &&
        proj.y < ARENA_H + 20,
    );

    for (const pickup of [...this.pickups]) {
      if (!aabb(p, pickup)) continue;
      this.pickups = this.pickups.filter((x) => x.id !== pickup.id);
      if (pickup.kind === "coin") {
        this.coins += pickup.value;
        this.bus.emit({ type: "coin_collected", data: { value: pickup.value } });
      } else {
        this.coins += pickup.value;
        this.bus.emit({ type: "chest_opened", data: { value: pickup.value } });
      }
    }

    if (!this.betweenWaves && this.enemies.length === 0 && this.spawnPending === 0) {
      this.betweenWaves = true;
      this.waveClearTimer = 1.2;
      this.bus.emit({ type: "wave_completed", data: { wave: this.wave } });
      if (Math.random() < 0.55) this.spawnPickup("coin");
      if (Math.random() < 0.28) this.spawnPickup("chest");
    }

    if (this.betweenWaves) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        this.beginWave(this.wave + 1);
      }
    }
  }

  private fireAtNearest(): void {
    const p = this.player;
    let nearest: Enemy | null = null;
    let best = Infinity;
    const origin: Vec2 = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
    for (const enemy of this.enemies) {
      const d = Math.hypot(
        origin.x - (enemy.x + enemy.w / 2),
        origin.y - (enemy.y + enemy.h / 2),
      );
      if (d < best && d < 220) {
        best = d;
        nearest = enemy;
      }
    }
    if (!nearest) return;
    const tx = nearest.x + nearest.w / 2 - origin.x;
    const ty = nearest.y + nearest.h / 2 - origin.y;
    const len = Math.hypot(tx, ty) || 1;
    const speed = 320;
    this.projectiles.push({
      id: this.nextId++,
      x: origin.x - 4,
      y: origin.y - 4,
      w: 8,
      h: 8,
      vx: (tx / len) * speed,
      vy: (ty / len) * speed,
      damage: 1,
      life: 0.9,
    });
  }

  private killEnemy(enemy: Enemy): void {
    this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
    this.bus.emit({
      type: "enemy_killed",
      data: { enemyType: enemy.kind },
    });
    if (Math.random() < 0.35) {
      this.pickups.push({
        id: this.nextId++,
        x: enemy.x,
        y: enemy.y,
        w: 12,
        h: 12,
        vx: 0,
        vy: 0,
        kind: "coin",
        value: 1,
      });
    }
  }

  private spawnPickup(kind: "coin" | "chest"): void {
    this.pickups.push({
      id: this.nextId++,
      x: rand(40, ARENA_W - 40),
      y: rand(40, ARENA_H - 40),
      w: kind === "chest" ? 20 : 12,
      h: kind === "chest" ? 16 : 12,
      vx: 0,
      vy: 0,
      kind,
      value: kind === "chest" ? 5 : 1,
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ARENA_W, ARENA_H);

    const grad = ctx.createLinearGradient(0, 0, ARENA_W, ARENA_H);
    grad.addColorStop(0, "#1a2332");
    grad.addColorStop(1, "#0f1419");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < ARENA_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_H);
      ctx.stroke();
    }
    for (let y = 0; y < ARENA_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_W, y);
      ctx.stroke();
    }

    for (const pickup of this.pickups) {
      if (pickup.kind === "coin") {
        ctx.fillStyle = "#e8b84a";
        ctx.beginPath();
        ctx.arc(
          pickup.x + pickup.w / 2,
          pickup.y + pickup.h / 2,
          pickup.w / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else {
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(pickup.x, pickup.y, pickup.w, pickup.h);
        ctx.fillStyle = "#d4a017";
        ctx.fillRect(pickup.x + 4, pickup.y + 5, pickup.w - 8, 4);
      }
    }

    for (const enemy of this.enemies) {
      ctx.fillStyle = enemy.kind === "slime" ? "#3ecf8e" : "#e85d5d";
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(enemy.x + 4, enemy.y + 5, 3, 3);
      ctx.fillRect(enemy.x + enemy.w - 7, enemy.y + 5, 3, 3);
    }

    for (const proj of this.projectiles) {
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.arc(proj.x + 4, proj.y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const p = this.player;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0;
    if (!blink) {
      ctx.fillStyle = "#5b8def";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(p.x + 5, p.y + 6, 4, 4);
      ctx.fillRect(p.x + p.w - 9, p.y + 6, 4, 4);
    }

    if (this.phase === "ready") {
      this.drawOverlay(ctx, "Dungeon Survivor", "Pressione Jogar para começar");
    } else if (this.phase === "dead") {
      this.drawOverlay(
        ctx,
        "Você morreu",
        `Wave ${this.wave} · ${this.coins} moedas`,
      );
    }
  }

  private drawOverlay(
    ctx: CanvasRenderingContext2D,
    title: string,
    subtitle: string,
  ): void {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 28px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, ARENA_W / 2, ARENA_H / 2 - 10);
    ctx.font = "16px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(subtitle, ARENA_W / 2, ARENA_H / 2 + 24);
  }
}
