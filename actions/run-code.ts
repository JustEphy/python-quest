"use server";

export type RunnerActionState = {
  ok: boolean;
  stdout: string;
  stderr: string;
  message?: string;
  passed?: boolean;
};

const RUNNER_TIMEOUT_MS = 10_000;

export const INITIAL_RUNNER_STATE: RunnerActionState = {
  ok: false,
  stdout: "",
  stderr: "",
};

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

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
  const runnerToken = process.env.RUNNER_SHARED_TOKEN;

  if (!runnerToken) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Runner token is not configured.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RUNNER_TIMEOUT_MS);

  try {
    const response = await fetch(`${runnerUrl}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Runner-Token": runnerToken,
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        stdout: "",
        stderr: "",
        message: response.status === 401 ? "Runner authentication failed." : "Runner service unavailable.",
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
  } catch (error) {
    if (isAbortError(error)) {
      return {
        ok: false,
        stdout: "",
        stderr: "",
        message: "Runner request timed out. Please try again.",
      };
    }

    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Runner service unavailable.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
