create table if not exists public.cash_account_profiles (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 cash_name text not null,
 ledger_id uuid,
 cash_code text,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(company_id,cash_name),
 foreign key(company_id,ledger_id) references public.chart_of_accounts(company_id,id) on delete restrict
);
alter table public.cash_account_profiles enable row level security;
drop policy if exists cash_account_profiles_owner_access on public.cash_account_profiles;
create policy cash_account_profiles_owner_access on public.cash_account_profiles for all using(private.is_company_owner(company_id)) with check(private.is_company_owner(company_id));
drop policy if exists cash_account_profiles_user_read on public.cash_account_profiles;
create policy cash_account_profiles_user_read on public.cash_account_profiles for select using(private.has_company_user_permission(company_id,'accounting',false));
drop policy if exists cash_account_profiles_user_write on public.cash_account_profiles;
create policy cash_account_profiles_user_write on public.cash_account_profiles for all using(private.has_company_user_permission(company_id,'accounting',true)) with check(private.has_company_user_permission(company_id,'accounting',true));
drop policy if exists cash_account_profiles_ca_read on public.cash_account_profiles;
create policy cash_account_profiles_ca_read on public.cash_account_profiles for select using(private.has_ca_company_access(company_id,false));
drop policy if exists cash_account_profiles_ca_write on public.cash_account_profiles;
create policy cash_account_profiles_ca_write on public.cash_account_profiles for all using(private.has_ca_company_access(company_id,true)) with check(private.has_ca_company_access(company_id,true));
grant select,insert,update,delete on public.cash_account_profiles to authenticated;