import { PetCard } from "@/components/pet-card";
import { createClient } from "@/lib/supabase/server";
import { derivePetState } from "@/lib/gamification";

export default async function PetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [xpResult, streakResult, petResult] = await Promise.all([
    supabase.from("xp_events").select("amount").eq("user_id", user.id),
    supabase.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("pets")
      .select("species, evolution_stage, happiness")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const totalXp = (xpResult.data ?? []).reduce((sum, item) => sum + item.amount, 0);
  const fallback = derivePetState(totalXp, streakResult.data?.current_streak ?? 0);

  const pet = {
    species: petResult.data?.species ?? fallback.species,
    evolutionStage: petResult.data?.evolution_stage ?? fallback.evolutionStage,
    happiness: petResult.data?.happiness ?? fallback.happiness,
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your Pet</h1>
      <p className="text-muted-foreground">Study daily to evolve your companion.</p>
      <div className="max-w-sm">
        <PetCard
          species={pet.species}
          evolutionStage={pet.evolutionStage}
          happiness={pet.happiness}
        />
      </div>
    </main>
  );
}
