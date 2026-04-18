import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const petEmoji: Record<string, string> = {
  egg: "🥚",
  fox: "🦊",
  griffin: "🦅",
  dragon: "🐉",
};

export function PetCard({
  species,
  evolutionStage,
  happiness,
}: {
  species: string;
  evolutionStage: number;
  happiness: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Virtual Pet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-5xl">{petEmoji[species] ?? "🐣"}</div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Species: {species}</p>
          <p>Evolution stage: {evolutionStage}</p>
          <p>Happiness: {happiness}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
