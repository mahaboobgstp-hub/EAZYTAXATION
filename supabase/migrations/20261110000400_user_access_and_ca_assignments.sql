-- EazyTaxation: company users and Chartered Accountant access.
-- Company owners retain full access. Invited users and CAs are scoped to
-- explicitly assigned companies and permissions.

create table if not exists public.company_user_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'Accounts',
  status text not null default 'Active' check (status in ('Active','Inactive','Invited')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,user_id)
);

create table if not exists public.ca_company_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ca_user_id uuid not null references auth.users(id) on delete cascade,
  ca_email text not null,
  ca_name text not null,
  access_level text not null default 'read_only'
    check (access_level in ('read_only','read_write')),
  status text not null default 'Active' check (status in ('Active','Revoked')),
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,ca_user_id)
);

create index if not exists company_user_access_user_idx
  on public.company_user_access(user_id,status);
create index if not exists company_user_access_company_idx
  on public.company_user_access(company_id,status);
create index if not exists ca_company_assignments_user_idx
  on public.ca_company_assignments(ca_user_id,status);
create index if not exists ca_company_assignments_company_idx
  on public.ca_company_assignments(company_id,status);

alter table public.company_user_access enable row level security;
alter table public.ca_company_assignments enable row level security;

drop policy if exists company_user_access_owner_all on public.company_user_access;
create policy company_user_access_owner_all on public.company_user_access
  for all to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id=company_user_access.company_id
      and c.owner_user_id=(select auth.uid())
  ))
  with check (exists (
    select 1 from public.companies c
    where c.id=company_user_access.company_id
      and c.owner_user_id=(select auth.uid())
  ));

drop policy if exists company_user_access_self_read on public.company_user_access;
create policy company_user_access_self_read on public.company_user_access
  for select to authenticated
  using (user_id=(select auth.uid()) and status='Active');

drop policy if exists ca_assignments_owner_all on public.ca_company_assignments;
create policy ca_assignments_owner_all on public.ca_company_assignments
  for all to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id=ca_company_assignments.company_id
      and c.owner_user_id=(select auth.uid())
  ))
  with check (exists (
    select 1 from public.companies c
    where c.id=ca_company_assignments.company_id
      and c.owner_user_id=(select auth.uid())
  ));

drop policy if exists ca_assignments_self_read on public.ca_company_assignments;
create policy ca_assignments_self_read on public.ca_company_assignments
  for select to authenticated
  using (ca_user_id=(select auth.uid()) and status='Active');

-- Let a CA discover only companies explicitly assigned to that CA.
drop policy if exists companies_ca_assigned_read on public.companies;
create policy companies_ca_assigned_read on public.companies
  for select to authenticated
  using (exists (
    select 1 from public.ca_company_assignments ca
    where ca.company_id=companies.id
      and ca.ca_user_id=(select auth.uid())
      and ca.status='Active'
  ));

-- Secure all public tables that carry company_id. Existing owner access is
-- explicitly preserved, and CA permissions are added as separate policies.
do $$
declare
  t record;
  owner_policy text;
  ca_read_policy text;
  ca_write_policy text;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema=c.table_schema and tb.table_name=c.table_name
    where c.table_schema='public'
      and c.column_name='company_id'
      and tb.table_type='BASE TABLE'
      and c.table_name not in ('company_user_access','ca_company_assignments','profiles')
  loop
    owner_policy := t.table_name || '_company_owner_access';
    ca_read_policy := t.table_name || '_ca_assigned_read';
    ca_write_policy := t.table_name || '_ca_assigned_write';

    execute format('alter table public.%I enable row level security',t.table_name);

    execute format('drop policy if exists %I on public.%I',owner_policy,t.table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.companies c
          where c.id=%I.company_id and c.owner_user_id=(select auth.uid()))
      ) with check (
        exists (select 1 from public.companies c
          where c.id=%I.company_id and c.owner_user_id=(select auth.uid()))
      )',
      owner_policy,t.table_name,t.table_name,t.table_name
    );

    execute format('drop policy if exists %I on public.%I',ca_read_policy,t.table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (select 1 from public.ca_company_assignments ca
          where ca.company_id=%I.company_id
            and ca.ca_user_id=(select auth.uid())
            and ca.status=''Active'')
      )',
      ca_read_policy,t.table_name,t.table_name
    );

    execute format('drop policy if exists %I on public.%I',ca_write_policy,t.table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.ca_company_assignments ca
          where ca.company_id=%I.company_id
            and ca.ca_user_id=(select auth.uid())
            and ca.status=''Active''
            and ca.access_level=''read_write'')
      ) with check (
        exists (select 1 from public.ca_company_assignments ca
          where ca.company_id=%I.company_id
            and ca.ca_user_id=(select auth.uid())
            and ca.status=''Active''
            and ca.access_level=''read_write'')
      )',
      ca_write_policy,t.table_name,t.table_name,t.table_name
    );
  end loop;
end $$;

grant select,insert,update,delete on public.company_user_access to authenticated;
grant select,insert,update,delete on public.ca_company_assignments to authenticated;
