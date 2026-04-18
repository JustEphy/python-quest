import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function LessonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lessonsResult = await supabase
    .from("lessons")
    .select("id, title, slug, lesson_order, xp_reward")
    .order("lesson_order", { ascending: true });

  const progressResult = user
    ? await supabase
        .from("user_lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
    : { data: [] as Array<{ lesson_id: string; completed: boolean }> };

  const progressMap = new Map((progressResult.data ?? []).map((p) => [p.lesson_id, p.completed]));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Lessons</h1>
      <p className="text-muted-foreground">Follow the lesson order and complete challenges for XP.</p>
      <div className="grid gap-4">
        {(lessonsResult.data ?? []).map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <CardTitle>
                {lesson.lesson_order}. {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">Reward: {lesson.xp_reward} XP</p>
              <div className="flex items-center gap-3">
                {progressMap.get(lesson.id) ? (
                  <span className="text-sm text-emerald-600">Completed</span>
                ) : (
                  <span className="text-sm text-amber-600">Pending</span>
                )}
                <Link href={`/playground?lesson=${lesson.slug}`} className="text-sm text-primary underline">
                  Open challenge
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
