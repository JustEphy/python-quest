import { CodeEditor } from "@/components/code-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const query = supabase
    .from("challenges")
    .select("id, title, prompt, starter_code, expected_output, lessons:lesson_id(slug, title)")
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
        <Card>
          <CardHeader>
            <CardTitle>{challenge.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{challenge.prompt}</p>
            <CodeEditor initialCode={challenge.starter_code} name="code" />
            <p className="text-xs text-muted-foreground">
              Challenge execution and submission are wired in the next phase.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
