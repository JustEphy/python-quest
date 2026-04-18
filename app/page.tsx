import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="rounded-full bg-muted px-3 py-1 text-sm">Python Quest MVP</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Learn Python like a game.
      </h1>
      <p className="max-w-2xl text-muted-foreground">
        Complete lessons, solve coding challenges, earn XP, keep your streak alive,
        and evolve your virtual pet.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    </main>
  );
}
