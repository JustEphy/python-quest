"use server";

export type RunnerActionState = {
  ok: boolean;
  stdout: string;
  stderr: string;
  message?: string;
  passed?: boolean;
};

export const INITIAL_RUNNER_STATE: RunnerActionState = {
  ok: false,
  stdout: "",
  stderr: "",
};

export async function runCode(
  _prevState: RunnerActionState,
  formData: FormData,
): Promise<RunnerActionState> {
  const code = String(formData.get("code") ?? "");

  if (!code.trim()) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Code is required.",
    };
  }

  const runnerUrl = process.env.PYTHON_RUNNER_URL ?? "http://localhost:4000";

  const response = await fetch(`${runnerUrl}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Runner service unavailable.",
    };
  }

  const result = (await response.json()) as {
    stdout?: string;
    stderr?: string;
    timedOut?: boolean;
    exitCode?: number;
  };

  return {
    ok: (result.exitCode ?? 1) === 0 && !result.timedOut,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    message: result.timedOut ? "Execution timed out." : undefined,
  };
}
