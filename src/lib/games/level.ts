/** Cumulative XP thresholds: L1=0, L2=100, L3=250, L4=450, … */
export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 1; n < level; n++) {
    total += 50 + 50 * n;
  }
  return total;
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpThresholdForLevel(level + 1) <= safe) {
    level += 1;
    if (level > 10_000) break;
  }
  return level;
}

export function xpProgressInLevel(xp: number): {
  level: number;
  current: number;
  next: number;
  intoLevel: number;
} {
  const level = levelFromXp(xp);
  const current = xpThresholdForLevel(level);
  const next = xpThresholdForLevel(level + 1);
  return {
    level,
    current,
    next,
    intoLevel: Math.max(0, Math.floor(xp) - current),
  };
}
