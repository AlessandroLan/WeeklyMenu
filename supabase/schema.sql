-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists weeks (
  id text primary key,          -- Monday of the week, e.g. '2026-08-24'
  menu jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  week_id text not null references weeks(id) on delete cascade,
  text text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shopping_items_week_id_idx on shopping_items(week_id);

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists weeks_set_updated_at on weeks;
create trigger weeks_set_updated_at
  before update on weeks
  for each row execute function set_updated_at();

-- Row Level Security: since the app has no individual login (just a shared
-- PIN checked in the browser), we allow the public "anon" key full access to
-- these two tables. This is fine for a private, low-stakes household list,
-- but be aware that anyone who obtained the anon key could read or write it
-- too - don't reuse this Supabase project for anything sensitive.
alter table weeks enable row level security;
alter table shopping_items enable row level security;

create policy "anon full access on weeks"
  on weeks for all
  to anon
  using (true)
  with check (true);

create policy "anon full access on shopping_items"
  on shopping_items for all
  to anon
  using (true)
  with check (true);
