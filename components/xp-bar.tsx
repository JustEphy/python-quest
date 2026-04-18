import { Progress } from "@/components/ui/progress";

export function XpBar({
  currentXp,
  nextLevelXp,
  progressPct,
}: {
  currentXp: number;
  nextLevelXp: number | null;
  progressPct: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>XP Progress</span>
        <span>
          {currentXp} XP{nextLevelXp ? ` / ${nextLevelXp} XP` : " (MAX)"}
        </span>
      </div>
      <Progress value={progressPct} />
    </div>
  );
}
