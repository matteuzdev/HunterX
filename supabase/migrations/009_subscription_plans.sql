-- HunterX subscription plans and entitlement layer.
-- Owner assignment is intentionally not hardcoded here; production owner was assigned separately.

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  tagline text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  monthly_tokens integer not null default 0 check (monthly_tokens >= 0),
  unlimited_tokens boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  public boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
revoke all on table public.subscription_plans from anon, authenticated;
grant select on table public.subscription_plans to anon, authenticated;

drop policy if exists "Public can read active public plans" on public.subscription_plans;
create policy "Public can read active public plans"
on public.subscription_plans for select to anon, authenticated
using (active = true and public = true);

insert into public.subscription_plans
(id,name,tagline,price_cents,monthly_tokens,unlimited_tokens,features,public,active,sort_order)
values
('free','Free','Para testar o HunterX sem compromisso.',0,100,false,'["100 tokens de boas-vindas","Histórico persistente","CRM e Pipeline","Focus Mode"]'::jsonb,true,true,10),
('starter','Starter','Para prospecção individual recorrente.',7900,1000,false,'["1.000 tokens por ciclo","Até 50 lotes de 20","Histórico sem novo consumo","CRM + Focus + Exportações"]'::jsonb,true,true,20),
('pro','Pro','Para quem prospecta todos os dias.',16900,3000,false,'["3.000 tokens por ciclo","Até 150 lotes de 20","Inteligência de segmentos","CRM + Focus + Exportações"]'::jsonb,true,true,30),
('agency','Agency','Volume alto para operações e agências.',39900,10000,false,'["10.000 tokens por ciclo","Até 500 lotes de 20","Inteligência de segmentos","CRM + Focus + Exportações"]'::jsonb,true,true,40),
('owner','Owner','Acesso interno HunterX.',0,0,true,'["Tokens ilimitados","Acesso integral ao engine"]'::jsonb,false,true,999)
on conflict (id) do update set
name=excluded.name,tagline=excluded.tagline,price_cents=excluded.price_cents,
monthly_tokens=excluded.monthly_tokens,unlimited_tokens=excluded.unlimited_tokens,
features=excluded.features,public=excluded.public,active=excluded.active,
sort_order=excluded.sort_order,updated_at=now();

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','paused')),
  source text not null default 'system',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;
revoke all on table public.user_subscriptions from anon;
grant select on table public.user_subscriptions to authenticated;

drop policy if exists "Users read own subscription" on public.user_subscriptions;
create policy "Users read own subscription"
on public.user_subscriptions for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_unlimited_account(p_user_id uuid)
returns boolean
language sql security definer stable set search_path=public
as $$
  select coalesce((
    select p.unlimited_tokens
    from public.user_subscriptions s
    join public.subscription_plans p on p.id=s.plan_id
    where s.user_id=p_user_id and s.status in ('active','trialing') and p.active=true
    limit 1
  ),false);
$$;

revoke all on function public.is_unlimited_account(uuid) from public,anon,authenticated;
grant execute on function public.is_unlimited_account(uuid) to service_role;

create or replace function public.get_hunter_account()
returns table(
  balance integer,daily_target integer,batch_size integer,focus_minutes integer,lofi_enabled boolean,
  plan_id text,plan_name text,unlimited_tokens boolean
)
language plpgsql security definer set search_path=public
as $$
declare uid uuid := (select auth.uid());
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform public.ensure_hunter_account();
 return query
 select w.balance,f.daily_target,f.batch_size,f.focus_minutes,f.lofi_enabled,p.id,p.name,p.unlimited_tokens
 from public.token_wallets w
 join public.focus_settings f on f.user_id=w.user_id
 join public.user_subscriptions s on s.user_id=w.user_id
 join public.subscription_plans p on p.id=s.plan_id
 where w.user_id=uid limit 1;
end;
$$;

revoke all on function public.get_hunter_account() from public,anon;
grant execute on function public.get_hunter_account() to authenticated;
