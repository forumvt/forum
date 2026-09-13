"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { toastAchievementUnlocked } from "@/components/games/dungeon-survivor/achievement-toast";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { DungeonEngine } from "@/lib/games/dungeon-survivor/engine";
import {
  postEvent,
  startRun,
} from "@/lib/games/dungeon-survivor/sync";
import type { GameSnapshot } from "@/lib/games/dungeon-survivor/types";

export function DungeonSurvivorGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<DungeonEngine | null>(null);
  const runIdRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);

  const [hud, setHud] = useState<GameSnapshot>({
    phase: "ready",
    wave: 0,
    coins: 0,
    hp: 100,
    maxHp: 100,
    enemiesAlive: 0,
    sessionXpHint: 0,
  });
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);

  const enqueueSync = useCallback(
    (type: Parameters<typeof postEvent>[1], data?: Record<string, unknown>) => {
      if (!isLoggedIn) return;
      queueRef.current = queueRef.current.then(async () => {
        let runId = runIdRef.current;
        if (!runId) {
          const started = await startRun();
          if (!started) return;
          runId = started.runId;
          runIdRef.current = runId;
        }
        const result = await postEvent(runId, type, data);
        if (!result) return;
        setTotalXp(result.totalXp);
        setLevel(result.level);
        if (engineRef.current) {
          engineRef.current.sessionXpHint += result.xpGained;
        }
        for (const achievement of result.unlockedAchievements) {
          toastAchievementUnlocked(achievement);
        }
      });
    },
    [isLoggedIn],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = new DungeonEngine();
    engineRef.current = engine;

    const unsub = engine.bus.subscribe((event) => {
      enqueueSync(event.type, event.data);
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      engine.setKey(e.code, true);
    };
    const onKeyUp = (e: KeyboardEvent) => engine.setKey(e.code, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      engine.update(dt);
      engine.draw(ctx);
      setHud(engine.snapshot());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      unsub();
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      engineRef.current = null;
    };
  }, [enqueueSync]);

  const handleStart = async () => {
    runIdRef.current = null;
    if (isLoggedIn) {
      const started = await startRun();
      if (started) runIdRef.current = started.runId;
    }
    engineRef.current?.start();
  };

  return (
    <div className="space-y-4">
      {!isLoggedIn && (
        <div className="border-border bg-muted/50 rounded-md border px-4 py-3 text-sm">
          Você pode jogar sem login. Entre pela barra superior para salvar XP e
          conquistas.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="tabular-nums">
          HP {hud.hp}/{hud.maxHp}
        </span>
        <span className="tabular-nums">Wave {hud.wave}</span>
        <span className="tabular-nums">Moedas {hud.coins}</span>
        <span className="tabular-nums">Inimigos {hud.enemiesAlive}</span>
        {isLoggedIn && (
          <>
            <span className="tabular-nums">
              XP sessão {hud.sessionXpHint}
            </span>
            {level != null && totalXp != null && (
              <span className="tabular-nums">
                Level {level} · {totalXp.toLocaleString("pt-BR")} XP
              </span>
            )}
          </>
        )}
      </div>

      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <canvas
          ref={canvasRef}
          width={720}
          height={420}
          className="h-auto w-full max-w-full touch-none"
          tabIndex={0}
          aria-label="Arena do Dungeon Survivor"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(hud.phase === "ready" || hud.phase === "dead") && (
          <Button type="button" onClick={handleStart}>
            {hud.phase === "dead" ? "Jogar de novo" : "Jogar"}
          </Button>
        )}
        <p className="text-muted-foreground self-center text-sm">
          Controles: WASD ou setas · ataque automático
        </p>
      </div>
    </div>
  );
}
