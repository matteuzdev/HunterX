-- HunterX tokens, focus settings, signup rate limits and packages.

create table if not exists public.token_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_granted integer not null default 0 check (lifetime_granted >= 0),
  lifetime_purchased integer not null default 0 check (lifetime_purchased >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  kind text not null check (kind in ('grant','purchase','search','refund','admin')),
  reference text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.token_packages (
  id text primary key,
  name text not null,
  tokens integer not null check (tokens > 0),
  bonus_tokens integer not null default 0 check (bonus_tokens >= 0),
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'BRL',
  checkout_url text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.focus_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_target integer not null default 100 check (daily_target between 20 and 5000),
  batch_size integer not null default 20 check (batch_size between 5 and 20),
  focus_minutes integer not null default 25 check (focus_minutes between 5 and 120),
  lofi_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.signup_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists token_ledger_user_created_idx on public.token_ledger(user_id,created_at desc);
create index if not exists signup_rate_limits_ip_created_idx on public.signup_rate_limits(ip_hash,created_at desc);
create index if not exists signup_rate_limits_email_created_idx on public.signup_rate_limits(email_hash,created_at desc);

alter table public.token_wallets enable row level security;
alter table public.token_ledger enable row level security;
alter table public.token_packages enable row level security;
alter table public.focus_settings enable row level security;
alter table public.signup_rate_limits enable row level security;

revoke all on table public.token_wallets, public.token_ledger, public.token_packages, public.focus_settings, public.signup_rate_limits from anon;
revoke all on table public.signup_rate_limits from authenticated;
grant select on table public.token_wallets, public.token_ledger, public.token_packages to authenticated;
grant select,insert,update on table public.focus_settings to authenticated;

drop policy if exists "Users read own token wallet" on public.token_wallets;
create policy "Users read own token wallet" on public.token_wallets
for select to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users read own token ledger" on public.token_ledger;
create policy "Users read own token ledger" on public.token_ledger
for select to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Authenticated read active token packages" on public.token_packages;
create policy "Authenticated read active token packages" on public.token_packages
for select to authenticated using (active=true);

drop policy if exists "Users manage own focus settings" on public.focus_settings;
create policy "Users manage own focus settings" on public.focus_settings
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

insert into public.token_packages(id,name,tokens,bonus_tokens,price_cents,sort_order)
values
 ('starter','Starter',200,0,1990,10),
 ('growth','Growth',1000,100,6990,20),
 ('scale','Scale',5000,1000,24990,30)
on conflict(id) do update set
 name=excluded.name,tokens=excluded.tokens,bonus_tokens=excluded.bonus_tokens,
 price_cents=excluded.price_cents,sort_order=excluded.sort_order,updated_at=now();

create or replace function public.ensure_hunter_account()
returns table(balance integer,daily_target integer,batch_size integer,focus_minutes integer,lofi_enabled boolean)
language plpgsql security definer set search_path=public
as $$
declare uid uuid := (select auth.uid());
begin
 if uid is null then raise exception 'Authentication required'; end if;
 insert into public.token_wallets(user_id,balance,lifetime_granted)
 values(uid,100,100) on conflict(user_id) do nothing;

 insert into public.token_ledger(user_id,delta,kind,reference,metadata)
 select uid,100,'grant','welcome','{"reason":"welcome_tokens"}'::jsonb
 where not exists(select 1 from public.token_ledger where user_id=uid and kind='grant' and reference='welcome');

 insert into public.focus_settings(user_id) values(uid) on conflict(user_id) do nothing;

 return query
 select w.balance,f.daily_target,f.batch_size,f.focus_minutes,f.lofi_enabled
 from public.token_wallets w join public.focus_settings f on f.user_id=w.user_id
 where w.user_id=uid;
end;
$$;

revoke all on function public.ensure_hunter_account() from public,anon;
grant execute on function public.ensure_hunter_account() to authenticated;

create or replace function public.consume_tokens(
 p_amount integer,p_reference text,p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql security definer set search_path=public
as $$
declare uid uuid := (select auth.uid()); new_balance integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_amount <= 0 then raise exception 'Invalid token amount'; end if;
 perform public.ensure_hunter_account();

 update public.token_wallets
 set balance=balance-p_amount,lifetime_spent=lifetime_spent+p_amount,updated_at=now()
 where user_id=uid and balance>=p_amount
 returning balance into new_balance;

 if new_balance is null then raise exception 'INSUFFICIENT_TOKENS'; end if;

 insert into public.token_ledger(user_id,delta,kind,reference,metadata)
 values(uid,-p_amount,'search',coalesce(p_reference,''),coalesce(p_metadata,'{}'::jsonb));

 return new_balance;
end;
$$;

revoke all on function public.consume_tokens(integer,text,jsonb) from public,anon;
grant execute on function public.consume_tokens(integer,text,jsonb) to authenticated;

create or replace function public.refund_tokens(
 p_amount integer,p_reference text,p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql security definer set search_path=public
as $$
declare uid uuid := (select auth.uid()); new_balance integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_amount <= 0 then raise exception 'Invalid token amount'; end if;

 update public.token_wallets
 set balance=balance+p_amount,updated_at=now()
 where user_id=uid returning balance into new_balance;

 insert into public.token_ledger(user_id,delta,kind,reference,metadata)
 values(uid,p_amount,'refund',coalesce(p_reference,''),coalesce(p_metadata,'{}'::jsonb));

 return new_balance;
end;
$$;

revoke all on function public.refund_tokens(integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.refund_tokens(integer,text,jsonb) to service_role;
