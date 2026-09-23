-- Entitlement-aware account initialization and metering.

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

 insert into public.user_subscriptions(user_id,plan_id,status,source)
 values(uid,'free','active','system')
 on conflict(user_id) do nothing;

 return query
 select w.balance,f.daily_target,f.batch_size,f.focus_minutes,f.lofi_enabled
 from public.token_wallets w
 join public.focus_settings f on f.user_id=w.user_id
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
declare uid uuid := (select auth.uid()); new_balance integer; unlimited boolean;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_amount <= 0 then raise exception 'Invalid token amount'; end if;
 perform public.ensure_hunter_account();

 select public.is_unlimited_account(uid) into unlimited;
 select balance into new_balance from public.token_wallets where user_id=uid;
 if unlimited then return new_balance; end if;

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

create or replace function public.search_hunter_directory_metered(
 p_keyword text,p_city text,p_limit integer default 20,p_reference text default ''
)
returns table(
 business_key text,name text,category text,city text,state text,address text,phone text,email text,
 website text,socials jsonb,rating numeric,reviews integer,business_status text,
 latitude double precision,longitude double precision,source text,last_seen_at timestamptz,
 last_crawled_at timestamptz,token_balance integer
)
language plpgsql security definer set search_path=public,extensions
as $$
declare
 uid uuid := (select auth.uid());
 lim integer := least(greatest(coalesce(p_limit,20),1),20);
 cost integer; new_balance integer; unlimited boolean;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform public.ensure_hunter_account();
 select public.is_unlimited_account(uid) into unlimited;

 select count(*)::integer into cost from (
   select 1 from public.business_directory b
   where b.verified=true
     and (lower(b.city)%lower(trim(p_city)) or lower(b.city) like '%'||lower(trim(p_city))||'%' or lower(trim(p_city)) like '%'||lower(b.city)||'%')
     and (
       lower(b.name)%lower(trim(p_keyword)) or lower(b.category)%lower(trim(p_keyword))
       or lower(b.cnae_description)%lower(trim(p_keyword))
       or lower(b.name) like '%'||lower(trim(p_keyword))||'%'
       or lower(b.category) like '%'||lower(trim(p_keyword))||'%'
       or lower(b.cnae_description) like '%'||lower(trim(p_keyword))||'%'
     )
   limit lim
 ) q;

 select balance into new_balance from public.token_wallets where user_id=uid;

 if cost>0 and not unlimited then
   update public.token_wallets
   set balance=balance-cost,lifetime_spent=lifetime_spent+cost,updated_at=now()
   where user_id=uid and balance>=cost
   returning balance into new_balance;

   if new_balance is null then raise exception 'INSUFFICIENT_TOKENS'; end if;

   insert into public.token_ledger(user_id,delta,kind,reference,metadata)
   values(uid,-cost,'search',coalesce(p_reference,''),
     jsonb_build_object('provider','hunter','count',cost,'keyword',p_keyword,'city',p_city));
 end if;

 return query
 select b.business_key,b.name,coalesce(nullif(b.category,''),b.cnae_description),
        b.city,b.state,b.address,b.phone,b.email,b.website,b.socials,b.rating,b.reviews,
        b.business_status,b.latitude,b.longitude,b.source,b.last_seen_at,b.last_crawled_at,new_balance
 from public.business_directory b
 where b.verified=true
   and (lower(b.city)%lower(trim(p_city)) or lower(b.city) like '%'||lower(trim(p_city))||'%' or lower(trim(p_city)) like '%'||lower(b.city)||'%')
   and (
     lower(b.name)%lower(trim(p_keyword)) or lower(b.category)%lower(trim(p_keyword))
     or lower(b.cnae_description)%lower(trim(p_keyword))
     or lower(b.name) like '%'||lower(trim(p_keyword))||'%'
     or lower(b.category) like '%'||lower(trim(p_keyword))||'%'
     or lower(b.cnae_description) like '%'||lower(trim(p_keyword))||'%'
   )
 order by greatest(
   similarity(lower(b.name),lower(trim(p_keyword))),
   similarity(lower(b.category),lower(trim(p_keyword))),
   similarity(lower(b.cnae_description),lower(trim(p_keyword)))
 ) desc,b.rating desc,b.reviews desc
 limit lim;
end;
$$;

revoke all on function public.search_hunter_directory_metered(text,text,integer,text) from public,anon;
grant execute on function public.search_hunter_directory_metered(text,text,integer,text) to authenticated;
