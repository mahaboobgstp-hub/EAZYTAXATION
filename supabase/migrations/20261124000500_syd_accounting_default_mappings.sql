create table if not exists public.syd_accounting_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  mapping_key text not null,
  ledger_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,mapping_key),
  foreign key(company_id,ledger_id) references public.chart_of_accounts(company_id,id) on delete restrict
);
alter table public.syd_accounting_mappings enable row level security;
drop policy if exists syd_accounting_mappings_owner_access on public.syd_accounting_mappings;
create policy syd_accounting_mappings_owner_access on public.syd_accounting_mappings
  for all using (private.is_company_owner(company_id)) with check (private.is_company_owner(company_id));
drop policy if exists syd_accounting_mappings_assigned_user_read on public.syd_accounting_mappings;
create policy syd_accounting_mappings_assigned_user_read on public.syd_accounting_mappings
  for select using (private.has_company_user_permission(company_id,'accounting',false));
drop policy if exists syd_accounting_mappings_assigned_user_write on public.syd_accounting_mappings;
create policy syd_accounting_mappings_assigned_user_write on public.syd_accounting_mappings
  for all using (private.has_company_user_permission(company_id,'accounting',true)) with check (private.has_company_user_permission(company_id,'accounting',true));
drop policy if exists syd_accounting_mappings_ca_read on public.syd_accounting_mappings;
create policy syd_accounting_mappings_ca_read on public.syd_accounting_mappings
  for select using (private.has_ca_company_access(company_id,false));
drop policy if exists syd_accounting_mappings_ca_write on public.syd_accounting_mappings;
create policy syd_accounting_mappings_ca_write on public.syd_accounting_mappings
  for all using (private.has_ca_company_access(company_id,true)) with check (private.has_ca_company_access(company_id,true));
grant select,insert,update,delete on public.syd_accounting_mappings to authenticated;