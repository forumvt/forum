import { cn } from "@/lib/utils";
import type { AchievementProgressView } from "@/types/achievement";

export function ProfileAchievements({
  achievements,
  unlockedCount,
  totalCount,
}: {
  achievements: AchievementProgressView[];
  unlockedCount: number;
  totalCount: number;
}) {
  return (
    <section className="mt-8" aria-labelledby="achievements-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="achievements-heading" className="text-xl font-semibold">
          Conquistas
        </h2>
        <p className="text-muted-foreground text-sm tabular-nums">
          {unlockedCount} / {totalCount} desbloqueadas
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {achievements.map((achievement) => {
          const pct = Math.min(
            100,
            Math.round((achievement.progress / achievement.target) * 100),
          );
          return (
            <li
              key={achievement.id}
              className={cn(
                "border-border rounded-md border p-4 transition-opacity",
                achievement.unlocked
                  ? "bg-card"
                  : "bg-muted/40 opacity-70",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className="text-2xl leading-none"
                  aria-hidden
                >
                  {achievement.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {achievement.description}
                  </p>
                  {!achievement.unlocked && (
                    <div className="mt-3">
                      <div className="text-muted-foreground mb-1 flex justify-between text-xs tabular-nums">
                        <span>
                          {Math.min(achievement.progress, achievement.target)} /{" "}
                          {achievement.target}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <p className="text-primary mt-2 text-xs font-medium">
                      Desbloqueada
                      {achievement.rewardXp > 0
                        ? ` · +${achievement.rewardXp} XP`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
