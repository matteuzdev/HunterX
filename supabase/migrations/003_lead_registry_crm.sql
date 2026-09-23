-- HunterX global lead CRM and deduplication.
create table if not exists public.lead_registry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_key text not null,
  name text not null,
  city text not null default '',
  source text not null default 'unknown',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'novo'
    check (status in ('novo','analisado','demonstracao','contatado','respondeu','negociacao','cliente','perdido')),
  notes text not null default '',
  seen_count integer not null default 1 check (seen_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  contacted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lead_key)
);

create index if not exists lead_registry_user_status_idx
  on public.lead_registry (user_id, status);

create index if not exists lead_registry_user_last_seen_idx
  on public.lead_registry (user_id, last_seen_at desc);

alter table public.lead_registry enable row level security;

revoke all on table public.lead_registry from anon;
grant select, insert, update, delete on table public.lead_registry to authenticated;

drop policy if exists "Users can read own leads" on public.lead_registry;
create policy "Users can read own leads"
on public.lead_registry for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert own leads" on public.lead_registry;
create policy "Users can insert own leads"
on public.lead_registry for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own leads" on public.lead_registry;
create policy "Users can update own leads"
on public.lead_registry for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own leads" on public.lead_registry;
create policy "Users can delete own leads"
on public.lead_registry for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.sync_lead_registry(p_leads jsonb)
returns table (
  lead_key text,
  status text,
  seen_count integer,
  first_seen_at timestamptz,
  last_seen_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  return query
  insert into public.lead_registry (user_id, lead_key, name, city, source, data)
  select
    (select auth.uid()),
    coalesce(nullif(elem->>'source',''),'unknown') || ':' || coalesce(nullif(elem->>'id',''), md5(elem::text)),
    coalesce(nullif(elem->>'name',''),'Empresa'),
    coalesce(elem->>'city',''),
    coalesce(nullif(elem->>'source',''),'unknown'),
    elem
  from jsonb_array_elements(coalesce(p_leads, '[]'::jsonb)) elem
  on conflict (user_id, lead_key) do update
  set
    name = excluded.name,
    city = excluded.city,
    source = excluded.source,
    data = excluded.data,
    seen_count = public.lead_registry.seen_count + 1,
    last_seen_at = now(),
    updated_at = now()
  returning
    public.lead_registry.lead_key,
    public.lead_registry.status,
    public.lead_registry.seen_count,
    public.lead_registry.first_seen_at,
    public.lead_registry.last_seen_at;
end;
$$;

revoke all on function public.sync_lead_registry(jsonb) from public, anon;
grant execute on function public.sync_lead_registry(jsonb) to authenticated;
