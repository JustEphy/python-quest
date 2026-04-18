"use server";

import { derivePetState } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";
import type { RunnerActionState } from "@/actions/run-code";

export const INITIAL_SUBMIT_STATE: RunnerActionState = {
  ok: false,
  stdout: "",
  stderr: "",
};

function utcDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousUtcDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return utcDateOnly(date);
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
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Please log in first.",
    };
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, lesson_id, test_code, xp_reward")
    .eq("id", challengeId)
    .maybeSingle();

  if (!challenge) {
    return {
      ok: false,
      stdout: "",
      stderr: "",
      message: "Challenge not found.",
    };
  }

  const response = await fetch(`${process.env.PYTHON_RUNNER_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: `${code}

${challenge.test_code}`,
    }),
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
    passed?: boolean;
  };

  const passed = Boolean(result.passed || ((result.exitCode ?? 1) === 0 && !result.timedOut));

  await supabase.from("submissions").insert({
    user_id: user.id,
    challenge_id: challenge.id,
    code,
    passed,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  });

  if (!passed) {
    return {
      ok: false,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      message: result.timedOut ? "Tests timed out." : "Tests failed.",
      passed: false,
    };
  }

  const { data: existingPass } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", user.id)
    .eq("challenge_id", challenge.id)
    .eq("passed", true)
    .neq("code", code)
    .limit(1)
    .maybeSingle();

  await supabase.from("user_lesson_progress").upsert({
    user_id: user.id,
    lesson_id: challenge.lesson_id,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (!existingPass) {
    await supabase.from("xp_events").insert({
      user_id: user.id,
      source: `challenge:${challenge.id}`,
      amount: challenge.xp_reward,
      metadata: { challengeId: challenge.id },
    });
  }

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, last_active_date")
    .eq("user_id", user.id)
    .maybeSingle();

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

  await supabase.from("streaks").upsert({
    user_id: user.id,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_active_date: today,
    updated_at: new Date().toISOString(),
  });

  const { data: xpRows } = await supabase.from("xp_events").select("amount").eq("user_id", user.id);
  const totalXp = (xpRows ?? []).reduce((sum, row) => sum + row.amount, 0);
  const pet = derivePetState(totalXp, currentStreak);

  await supabase.from("pets").upsert({
    user_id: user.id,
    species: pet.species,
    evolution_stage: pet.evolutionStage,
    happiness: pet.happiness,
    updated_at: new Date().toISOString(),
  });

  return {
    ok: true,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    message: `Challenge passed! +${existingPass ? 0 : challenge.xp_reward} XP`,
    passed: true,
  };
}
