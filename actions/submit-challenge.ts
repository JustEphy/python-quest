"use server";

import { randomUUID } from "node:crypto";
import { derivePetState } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";
import type { RunnerActionState } from "@/actions/run-code";

export const INITIAL_SUBMIT_STATE: RunnerActionState = {
  ok: false,
  stdout: "",
  stderr: "",
};

const RUNNER_TIMEOUT_MS = 10_000;

function utcDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousUtcDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return utcDateOnly(date);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function removeSentinelLine(output: string, sentinel: string) {
  return output
    .split("\n")
    .filter((line) => line.trim() !== sentinel)
    .join("\n")
    .replace(/\n+$/, "");
}

export async function submitChallenge(
  _prevState: RunnerActionState,
  formData: FormData,
): Promise<RunnerActionState> {
  const code = String(formData.get("code") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");

  if (!code.trim() || !challengeId) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Missing challenge or code.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Please log in first.",
    };
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, lesson_id, test_code, xp_reward")
    .eq("id", challengeId)
    .maybeSingle();

  if (challengeError || !challenge) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Challenge not found.",
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

  const { data: existingPass, error: existingPassError } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", user.id)
    .eq("challenge_id", challenge.id)
    .eq("passed", true)
    .limit(1)
    .maybeSingle();

  if (existingPassError) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Could not load submission history.",
    };
  }

  const passSentinel = `PYQ_PASS_${randomUUID()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RUNNER_TIMEOUT_MS);

  let result: {
    stdout?: string;
    stderr?: string;
    timedOut?: boolean;
    exitCode?: number;
  };

  try {
    const response = await fetch(`${runnerUrl}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Runner-Token": runnerToken,
      },
      body: JSON.stringify({
        code: `${code}

${challenge.test_code}

print("${passSentinel}")`,
      }),
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

    result = (await response.json()) as {
      stdout?: string;
      stderr?: string;
      timedOut?: boolean;
      exitCode?: number;
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

  const rawStdout = result.stdout ?? "";
  const sentinelSeen = rawStdout.split(/\r?\n/).some((line) => line.trim() === passSentinel);
  const submissionStdout = removeSentinelLine(rawStdout, passSentinel);
  const passed = Boolean(sentinelSeen && (result.exitCode ?? 1) === 0 && !result.timedOut);

  const { error: submissionError } = await supabase.from("submissions").insert({
    user_id: user.id,
    challenge_id: challenge.id,
    code,
    passed,
    stdout: submissionStdout,
    stderr: result.stderr ?? "",
  });

  if (submissionError) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: "Could not save submission.",
      passed: false,
    };
  }

  if (!passed) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: result.timedOut ? "Tests timed out." : "Tests failed.",
      passed: false,
    };
  }


  const { error: progressError } = await supabase.from("user_lesson_progress").upsert({
    user_id: user.id,
    lesson_id: challenge.lesson_id,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (progressError) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: "Could not update lesson progress.",
      passed: false,
    };
  }

  if (!existingPass) {
    const { error: xpEventError } = await supabase.from("xp_events").insert({
      user_id: user.id,
      source: `challenge:${challenge.id}`,
      amount: challenge.xp_reward,
      metadata: { challengeId: challenge.id },
    });

    if (xpEventError) {
      return {
        ok: false,
        stdout: submissionStdout,
        stderr: result.stderr ?? "",
        message: "Could not award XP.",
        passed: false,
      };
    }
  }

  const { data: streak, error: streakError } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, last_active_date")
    .eq("user_id", user.id)
    .maybeSingle();

  if (streakError) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: "Could not load streak data.",
      passed: false,
    };
  }

  const today = utcDateOnly();
  const yesterday = previousUtcDate(today);

  let currentStreak = streak?.current_streak ?? 0;
  let longestStreak = streak?.longest_streak ?? 0;

  if (streak?.last_active_date === today) {
    // already counted today
  } else if (streak?.last_active_date === yesterday) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  const { error: streakUpsertError } = await supabase.from("streaks").upsert({
    user_id: user.id,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_active_date: today,
    updated_at: new Date().toISOString(),
  });

  if (streakUpsertError) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: "Could not update streak.",
      passed: false,
    };
  }

  const { data: xpRows, error: xpRowsError } = await supabase.from("xp_events").select("amount").eq("user_id", user.id);

  if (xpRowsError) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: "Could not load XP.",
      passed: false,
    };
  }

  const totalXp = (xpRows ?? []).reduce((sum, row) => sum + row.amount, 0);
  const pet = derivePetState(totalXp, currentStreak);

  const { error: petError } = await supabase.from("pets").upsert({
    user_id: user.id,
    species: pet.species,
    evolution_stage: pet.evolutionStage,
    happiness: pet.happiness,
    updated_at: new Date().toISOString(),
  });

  if (petError) {
    return {
      ok: false,
      stdout: submissionStdout,
      stderr: result.stderr ?? "",
      message: "Could not update pet state.",
      passed: false,
    };
  }

  return {
    ok: true,
    stdout: submissionStdout,
    stderr: result.stderr ?? "",
    message: `Challenge passed! +${existingPass ? 0 : challenge.xp_reward} XP`,
    passed: true,
  };
}
