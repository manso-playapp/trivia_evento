create extension if not exists pgcrypto;

create table if not exists public.game_sessions (
  id text primary key,
  revision integer not null default 0,
  state jsonb not null,
  last_event jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_events (
  id text primary key,
  game_id text not null references public.game_sessions(id) on delete cascade,
  revision integer not null,
  type text not null,
  actor_role text not null,
  actor_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists game_events_game_id_revision_idx
  on public.game_events (game_id, revision desc);

alter table public.game_sessions enable row level security;
alter table public.game_events enable row level security;

drop policy if exists "anon_read_game_sessions" on public.game_sessions;
create policy "anon_read_game_sessions"
  on public.game_sessions
  for select
  to anon
  using (true);

drop policy if exists "anon_write_game_sessions" on public.game_sessions;
create policy "anon_write_game_sessions"
  on public.game_sessions
  for insert
  to anon
  with check (true);

drop policy if exists "anon_update_game_sessions" on public.game_sessions;
create policy "anon_update_game_sessions"
  on public.game_sessions
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "anon_read_game_events" on public.game_events;
create policy "anon_read_game_events"
  on public.game_events
  for select
  to anon
  using (true);

drop policy if exists "anon_insert_game_events" on public.game_events;
create policy "anon_insert_game_events"
  on public.game_events
  for insert
  to anon
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_sessions'
  ) then
    alter publication supabase_realtime add table public.game_sessions;
  end if;
end $$;

-- Tabla de respuestas separada del snapshot para evitar conflictos de revision
-- entre mesas concurrentes. Ver migrations/002_submitted_answers.sql.
create table if not exists public.submitted_answers (
  game_id      text    not null references public.game_sessions(id) on delete cascade,
  table_id     text    not null,
  question_id  text    not null,
  round_number integer not null,
  option_id    text    not null,
  updated_at   timestamptz not null default now(),
  primary key (game_id, table_id, round_number)
);

alter table public.submitted_answers enable row level security;

drop policy if exists "anon_read_submitted_answers" on public.submitted_answers;
create policy "anon_read_submitted_answers"
  on public.submitted_answers
  for select
  to anon
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_events'
  ) then
    alter publication supabase_realtime add table public.game_events;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submitted_answers'
  ) then
    alter publication supabase_realtime add table public.submitted_answers;
  end if;
end $$;
