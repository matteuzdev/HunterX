-- HunterX search persistence
-- Anonymous Supabase Auth users assume the authenticated role.

create table if not exists public.search_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  city text not null,
  mode text not null default 'live',
  leads jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists search_snapshots_user_created_idx
  on public.search_snapshots (user_id, created_at desc);

alter table public.search_snapshots enable row level security;

revoke all on table public.search_snapshots from anon;
grant select, insert, delete on table public.search_snapshots to authenticated;

drop policy if exists "Users can read own search snapshots" on public.search_snapshots;
create policy "Users can read own search snapshots"
on public.search_snapshots
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert own search snapshots" on public.search_snapshots;
create policy "Users can insert own search snapshots"
on public.search_snapshots
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own search snapshots" on public.search_snapshots;
create policy "Users can delete own search snapshots"
on public.search_snapshots
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
