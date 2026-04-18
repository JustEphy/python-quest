import Link from "next/link";
import { PetCard } from "@/components/pet-card";
import { XpBar } from "@/components/xp-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { computeDashboardState } from "@/lib/gamification";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [xpResult, streakResult, progressResult, submissionsResult] = await Promise.all([
    supabase.from("xp_events").select("amount").eq("user_id", user.id),
    supabase.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("passed", true),
  ]);

  const state = computeDashboardState(xpResult.data ?? [], streakResult.data);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Track your progress and keep your streak alive.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Level {state.level.level}: {state.level.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <XpBar
            currentXp={state.totalXp}
            nextLevelXp={state.progress.next?.minXp ?? null}
            progressPct={state.progress.progressPct}
          />
          <p className="text-sm text-muted-foreground">
            {state.progress.next
              ? `${state.progress.xpNeeded} XP to reach level ${state.progress.next.level}`
              : "You reached max level in the MVP."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Current streak" value={`${state.streak} days`} />
        <MetricCard title="Lessons completed" value={String(progressResult.count ?? 0)} />
        <MetricCard title="Challenges passed" value={String(submissionsResult.count ?? 0)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PetCard
          species={state.pet.species}
          evolutionStage={state.pet.evolutionStage}
          happiness={state.pet.happiness}
        />
        <Card>
          <CardHeader>
            <CardTitle>Continue quest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Jump back into lessons or practice in the playground.</p>
            <div className="flex gap-2">
              <Link className="text-sm text-primary underline" href="/lessons">
                Open lessons
              </Link>
              <Link className="text-sm text-primary underline" href="/playground">
                Open playground
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
