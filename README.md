# Python Quest

Python Quest is a gamified Python learning MVP built with **Next.js App Router**, **TypeScript**, **Tailwind**, **shadcn/ui-style components**, **Supabase**, and a **separate Docker-based Python runner service**.

## Features
- Email/password auth (sign up, login, logout)
- Ordered lesson flow
- Coding challenge playground with starter code
- Secure Python execution through isolated runner service
- Challenge submission pass/fail
- XP events + level progression
- Daily streak tracking
- Virtual pet evolution based on activity
- Dashboard progress summary

## Stack
- Web: Next.js 16, React 19, TypeScript, Tailwind CSS
- UI: shadcn/ui-style primitives in `components/ui`
- Data/Auth: Supabase (Auth + Postgres + RLS)
- Runner: Node.js Express service running Python in disposable Docker containers

## 1) Prerequisites
- Node.js 20+
- npm 10+
- Docker (daemon running)
- Supabase project (local or hosted)

## 2) Environment setup
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (reserved for future admin operations)
- `PYTHON_RUNNER_URL` (default: `http://localhost:4000`)

## 3) Apply database schema + seed
Run these SQL files in order inside Supabase SQL editor (or via Supabase CLI):
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_seed.sql`

This creates and seeds:
- `profiles`
- `lessons`
- `challenges`
- `user_lesson_progress`
- `submissions`
- `xp_events`
- `streaks`
- `pets`

RLS policies are enabled so users can only access their own user-specific records; `lessons` and `challenges` are publicly readable.

## 4) Run the web app
```bash
npm install
npm run dev
```
Web app: http://localhost:3000

## 5) Run the Python runner service
```bash
cd runner
npm install
npm run dev
```
Runner: http://localhost:4000

Health check:
```bash
curl http://localhost:4000/health
```

## Optional: run both with Docker Compose
```bash
docker compose up --build
```

## Key directories
- `app/` - Next.js App Router pages
- `components/` - UI and feature components
- `actions/` - server actions (`run-code`, `submit-challenge`)
- `lib/` - Supabase clients + gamification/levels logic
- `supabase/migrations/` - schema and seed SQL
- `runner/` - isolated Python execution service
- `docs/` - roadmap/spec/curriculum/security notes

## Security model for execution
- Next.js server actions do **not** execute Python directly
- Runner executes code in `python:3.11-alpine` containers with:
  - `--network=none`
  - CPU/memory/pids limits
  - read-only filesystem + ephemeral tempfs
  - strict timeout
  - stdout/stderr truncation

See `docs/CODE_RUNNER_SECURITY.md` for details.

## License
MIT (`LICENSE`)
