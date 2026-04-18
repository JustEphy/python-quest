"use client";

import { useActionState, useMemo, useState } from "react";
import { INITIAL_RUNNER_STATE, runCode } from "@/actions/run-code";
import { INITIAL_SUBMIT_STATE, submitChallenge } from "@/actions/submit-challenge";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaygroundClient({
  challenge,
}: {
  challenge: {
    id: string;
    title: string;
    prompt: string;
    starter_code: string;
    expected_output: string | null;
  };
}) {
  const [code, setCode] = useState(challenge.starter_code);
  const [runState, runAction, runPending] = useActionState(runCode, INITIAL_RUNNER_STATE);
  const [submitState, submitAction, submitPending] = useActionState(
    submitChallenge,
    INITIAL_SUBMIT_STATE,
  );

  const combinedState = useMemo(() => {
    if (submitState.stdout || submitState.stderr || submitState.message) {
      return submitState;
    }
    return runState;
  }, [runState, submitState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{challenge.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{challenge.prompt}</p>
        <CodeEditor code={code} onCodeChange={setCode} />

        <div className="flex flex-wrap gap-2">
          <form action={runAction}>
            <input type="hidden" name="code" value={code} readOnly />
            <Button type="submit" disabled={runPending || submitPending}>
              {runPending ? "Running..." : "Run code"}
            </Button>
          </form>

          <form action={submitAction}>
            <input type="hidden" name="code" value={code} readOnly />
            <input type="hidden" name="challengeId" value={challenge.id} readOnly />
            <Button type="submit" disabled={runPending || submitPending}>
              {submitPending ? "Submitting..." : "Submit challenge"}
            </Button>
          </form>
        </div>

        {challenge.expected_output ? (
          <p className="text-xs text-muted-foreground">Expected sample output: {challenge.expected_output}</p>
        ) : null}

        {(combinedState.stdout || combinedState.stderr || combinedState.message) && (
          <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
            {combinedState.message ? <p>{combinedState.message}</p> : null}
            {combinedState.stdout ? (
              <div>
                <p className="mb-1 font-medium">stdout</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-background p-2">{combinedState.stdout}</pre>
              </div>
            ) : null}
            {combinedState.stderr ? (
              <div>
                <p className="mb-1 font-medium text-destructive">stderr</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-background p-2">{combinedState.stderr}</pre>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
