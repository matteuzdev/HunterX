-- HunterX export audit log
create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null default '',
  city text not null default '',
  lead_count integer not null default 0 check (lead_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists export_logs_user_created_idx
  on public.export_logs (user_id, created_at desc);

alter table public.export_logs enable row level security;

revoke all on table public.export_logs from anon;
grant select, insert, delete on table public.export_logs to authenticated;

drop policy if exists "Users can read own export logs" on public.export_logs;
create policy "Users can read own export logs"
on public.export_logs for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own export logs" on public.export_logs;
create policy "Users can insert own export logs"
on public.export_logs for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own export logs" on public.export_logs;
create policy "Users can delete own export logs"
on public.export_logs for delete to authenticated
using ((select auth.uid()) = user_id);
