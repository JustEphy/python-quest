create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  lesson_order int not null unique,
  content_markdown text not null,
  xp_reward int not null default 50,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  prompt text not null,
  starter_code text not null,
  test_code text not null,
  expected_output text,
  xp_reward int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  code text not null,
  passed boolean not null default false,
  stdout text,
  stderr text,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount int not null check (amount <> 0),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.pets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  species text not null default 'egg',
  evolution_stage int not null default 1,
  happiness int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.challenges enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.xp_events enable row level security;
alter table public.streaks enable row level security;
alter table public.pets enable row level security;

create policy "public can read lessons" on public.lessons
for select using (true);

create policy "public can read challenges" on public.challenges
for select using (true);

create policy "users can read own profile" on public.profiles
for select using (auth.uid() = id);
create policy "users can insert own profile" on public.profiles
for insert with check (auth.uid() = id);
create policy "users can update own profile" on public.profiles
for update using (auth.uid() = id);

create policy "users can read own lesson progress" on public.user_lesson_progress
for select using (auth.uid() = user_id);
create policy "users can insert own lesson progress" on public.user_lesson_progress
for insert with check (auth.uid() = user_id);
create policy "users can update own lesson progress" on public.user_lesson_progress
for update using (auth.uid() = user_id);

create policy "users can read own submissions" on public.submissions
for select using (auth.uid() = user_id);
create policy "users can insert own submissions" on public.submissions
for insert with check (auth.uid() = user_id);

create policy "users can read own xp events" on public.xp_events
for select using (auth.uid() = user_id);
create policy "users can insert own xp events" on public.xp_events
for insert with check (auth.uid() = user_id);

create policy "users can read own streak" on public.streaks
for select using (auth.uid() = user_id);
create policy "users can insert own streak" on public.streaks
for insert with check (auth.uid() = user_id);
create policy "users can update own streak" on public.streaks
for update using (auth.uid() = user_id);

create policy "users can read own pet" on public.pets
for select using (auth.uid() = user_id);
create policy "users can insert own pet" on public.pets
for insert with check (auth.uid() = user_id);
create policy "users can update own pet" on public.pets
for update using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.pets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
