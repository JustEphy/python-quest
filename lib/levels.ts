export type LevelInfo = {
  level: number;
  minXp: number;
  title: string;
};

export const LEVELS: LevelInfo[] = [
  { level: 1, minXp: 0, title: "Seed" },
  { level: 2, minXp: 100, title: "Sprout" },
  { level: 3, minXp: 250, title: "Apprentice" },
  { level: 4, minXp: 500, title: "Solver" },
  { level: 5, minXp: 900, title: "NeetCode Squire" },
  { level: 6, minXp: 1400, title: "Python Knight" },
];

export function getLevelFromXp(totalXp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.minXp) {
      current = level;
    }
  }
  return current;
}

export function getProgressToNextLevel(totalXp: number) {
  const current = getLevelFromXp(totalXp);
  const currentIndex = LEVELS.findIndex((l) => l.level === current.level);
  const next = LEVELS[currentIndex + 1];

  if (!next) {
    return {
      current,
      next: null,
      progressPct: 100,
      xpIntoLevel: totalXp - current.minXp,
      xpNeeded: 0,
    };
  }

  const span = next.minXp - current.minXp;
  const xpIntoLevel = totalXp - current.minXp;

  return {
    current,
    next,
    progressPct: Math.max(0, Math.min(100, (xpIntoLevel / span) * 100)),
    xpIntoLevel,
    xpNeeded: next.minXp - totalXp,
  };
}
