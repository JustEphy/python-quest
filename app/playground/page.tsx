import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PlaygroundClient } from "@/components/playground-client";

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const query = supabase
    .from("challenges")
    .select("id, title, prompt, starter_code, expected_output, lessons:lesson_id(slug)")
    .order("created_at", { ascending: true });

  const challengeResult = params.lesson
    ? await query.eq("lessons.slug", params.lesson).limit(1).maybeSingle()
    : await query.limit(1).maybeSingle();

  const challenge = challengeResult.data;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Playground</h1>
      {!challenge ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No challenges found.</CardContent>
        </Card>
      ) : (
        <PlaygroundClient challenge={challenge} />
      )}
    </main>
  );
}
