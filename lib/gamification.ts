import { getLevelFromXp, getProgressToNextLevel } from "@/lib/levels";

export type PetState = {
  species: string;
  evolutionStage: number;
  happiness: number;
};

export function calculateTotalXp(events: Array<{ amount: number }>) {
  return events.reduce((sum, event) => sum + event.amount, 0);
}

export function derivePetState(totalXp: number, currentStreak: number): PetState {
  if (totalXp >= 900 || currentStreak >= 14) {
    return { species: "dragon", evolutionStage: 4, happiness: Math.min(100, 60 + currentStreak * 2) };
  }
  if (totalXp >= 500 || currentStreak >= 7) {
    return { species: "griffin", evolutionStage: 3, happiness: Math.min(100, 45 + currentStreak * 3) };
  }
  if (totalXp >= 200 || currentStreak >= 3) {
    return { species: "fox", evolutionStage: 2, happiness: Math.min(100, 30 + currentStreak * 4) };
  }
  return { species: "egg", evolutionStage: 1, happiness: Math.min(100, 10 + currentStreak * 5) };
}

export function computeDashboardState(
  events: Array<{ amount: number }>,
  streak: { current_streak: number | null } | null,
) {
  const totalXp = calculateTotalXp(events);
  const level = getLevelFromXp(totalXp);
  const progress = getProgressToNextLevel(totalXp);
  const pet = derivePetState(totalXp, streak?.current_streak ?? 0);

  return {
    totalXp,
    level,
    progress,
    pet,
    streak: streak?.current_streak ?? 0,
  };
}
