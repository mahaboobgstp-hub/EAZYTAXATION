-- Replace policy subqueries with private SECURITY DEFINER predicates.
-- This avoids recursive RLS when a company policy consults membership tables.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_company_owner(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.companies c
    where c.id=p_company_id and c.owner_user_id=(select auth.uid())
  );
$$;

create or replace function private.has_ca_company_access(p_company_id uuid, p_write boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ca_company_assignments ca
    where ca.company_id=p_company_id
      and ca.ca_user_id=(select auth.uid())
      and ca.status='Active'
      and (not p_write or ca.access_level='read_write')
  );
$$;

create or replace function private.has_company_user_permission(
  p_company_id uuid,
  p_module text default null,
  p_write boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_user_access ua
    where ua.company_id=p_company_id
      and ua.user_id=(select auth.uid())
      and ua.status='Active'
      and (
        p_module is null
        or coalesce((ua.permissions -> p_module ->> case when p_write then 'write' else 'read' end)::boolean,false)
      )
  );
$$;

revoke all on function private.is_company_owner(uuid) from public, anon;
revoke all on function private.has_ca_company_access(uuid,boolean) from public, anon;
revoke all on function private.has_company_user_permission(uuid,text,boolean) from public, anon;
grant execute on function private.is_company_owner(uuid) to authenticated;
grant execute on function private.has_ca_company_access(uuid,boolean) to authenticated;
grant execute on function private.has_company_user_permission(uuid,text,boolean) to authenticated;

-- Membership and assignment tables.
drop policy if exists company_user_access_owner_all on public.company_user_access;
create policy company_user_access_owner_all on public.company_user_access
  for all to authenticated
  using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));

drop policy if exists company_user_access_self_read on public.company_user_access;
create policy company_user_access_self_read on public.company_user_access
  for select to authenticated
  using (user_id=(select auth.uid()) and status='Active');

drop policy if exists ca_assignments_owner_all on public.ca_company_assignments;
create policy ca_assignments_owner_all on public.ca_company_assignments
  for all to authenticated
  using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));

drop policy if exists ca_assignments_self_read on public.ca_company_assignments;
create policy ca_assignments_self_read on public.ca_company_assignments
  for select to authenticated
  using (ca_user_id=(select auth.uid()) and status='Active');

-- Company shell visibility.
drop policy if exists companies_owner_all on public.companies;
create policy companies_owner_all on public.companies
  for all to authenticated
  using (private.is_company_owner(id))
  with check (private.is_company_owner(id));

drop policy if exists companies_ca_assigned_read on public.companies;
create policy companies_ca_assigned_read on public.companies
  for select to authenticated
  using (private.has_ca_company_access(id,false));

drop policy if exists companies_assigned_user_read on public.companies;
create policy companies_assigned_user_read on public.companies
  for select to authenticated
  using (private.has_company_user_permission(id,null,false));

-- Company tables with a direct company_id.
do $$
declare
  t record;
  module_key text;
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
    module_key := case
      when t.table_name in ('customers','vendors','items','units','expense_categories','asset_categories') then 'masters'
      when t.table_name like '%purchase%' or t.table_name like '%vendor%' then 'purchase'
      when t.table_name like '%sales%' or t.table_name like '%quotation%' or t.table_name like '%delivery_challan%' or t.table_name like '%credit_note%' then 'sales'
      when t.table_name like '%bank%' or t.table_name like '%reconcil%' then 'banking'
      when t.table_name like '%gst%' or t.table_name like '%eway%' or t.table_name like '%einvoice%' then 'gst'
      when t.table_name like '%employee%' or t.table_name like '%payroll%' or t.table_name like '%attendance%' or t.table_name like '%leave%' or t.table_name like '%statutory%' or t.table_name like '%professional_tax%' or t.table_name like '%salary_tds%' or t.table_name like '%salary_component%' or t.table_name like '%company_pt%' then 'hr_payroll'
      when t.table_name like '%stock%' or t.table_name like '%inventory%' then 'inventory'
      when t.table_name like '%report%' then 'reports'
      when t.table_name like '%expense%' or t.table_name like '%payment%' then 'expenses'
      else 'accounting'
    end;

    execute format('drop policy if exists %I on public.%I',t.table_name||'_company_owner_access',t.table_name);
    execute format('create policy %I on public.%I for all to authenticated using (private.is_company_owner(company_id)) with check (private.is_company_owner(company_id))',t.table_name||'_company_owner_access',t.table_name);

    execute format('drop policy if exists %I on public.%I',t.table_name||'_ca_assigned_read',t.table_name);
    execute format('create policy %I on public.%I for select to authenticated using (private.has_ca_company_access(company_id,false))',t.table_name||'_ca_assigned_read',t.table_name);

    execute format('drop policy if exists %I on public.%I',t.table_name||'_ca_assigned_write',t.table_name);
    execute format('create policy %I on public.%I for all to authenticated using (private.has_ca_company_access(company_id,true)) with check (private.has_ca_company_access(company_id,true))',t.table_name||'_ca_assigned_write',t.table_name);

    execute format('drop policy if exists %I on public.%I',t.table_name||'_assigned_user_read',t.table_name);
    execute format('create policy %I on public.%I for select to authenticated using (private.has_company_user_permission(company_id,%L,false))',t.table_name||'_assigned_user_read',t.table_name,module_key);

    execute format('drop policy if exists %I on public.%I',t.table_name||'_assigned_user_write',t.table_name);
    execute format('create policy %I on public.%I for all to authenticated using (private.has_company_user_permission(company_id,%L,true)) with check (private.has_company_user_permission(company_id,%L,true))',t.table_name||'_assigned_user_write',t.table_name,module_key,module_key);
  end loop;
end $$;

-- Detail/line tables inherit access from their parent record's company_id.
do $$
declare
  t record;
  module_key text;
  owner_policy text;
  ca_read_policy text;
  ca_write_policy text;
  user_read_policy text;
  user_write_policy text;
begin
  for t in
    select child.relname as child_table,
      child_column.attname as child_column,
      parent.relname as parent_table
    from pg_constraint fk
    join pg_class child on child.oid=fk.conrelid
    join pg_namespace child_ns on child_ns.oid=child.relnamespace
    join pg_class parent on parent.oid=fk.confrelid
    join pg_namespace parent_ns on parent_ns.oid=parent.relnamespace
    join pg_attribute child_column
      on child_column.attrelid=child.oid and child_column.attnum=fk.conkey[1]
    where fk.contype='f'
      and array_length(fk.conkey,1)=1
      and child_ns.nspname='public'
      and parent_ns.nspname='public'
      and not exists (
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name=child.relname and c.column_name='company_id'
      )
      and exists (
        select 1 from information_schema.columns p
        where p.table_schema='public' and p.table_name=parent.relname and p.column_name='company_id'
      )
  loop
    module_key := case
      when t.parent_table in ('customers','vendors','items','units') then 'masters'
      when t.parent_table like '%purchase%' or t.parent_table like '%vendor%' then 'purchase'
      when t.parent_table like '%sales%' or t.parent_table like '%quotation%' or t.parent_table like '%delivery_challan%' or t.parent_table like '%credit_note%' then 'sales'
      when t.parent_table like '%bank%' or t.parent_table like '%reconcil%' then 'banking'
      when t.parent_table like '%gst%' or t.parent_table like '%eway%' or t.parent_table like '%einvoice%' then 'gst'
      when t.parent_table like '%employee%' or t.parent_table like '%payroll%' or t.parent_table like '%attendance%' or t.parent_table like '%leave%' or t.parent_table like '%statutory%' or t.parent_table like '%professional_tax%' or t.parent_table like '%salary_tds%' or t.parent_table like '%salary_component%' or t.parent_table like '%company_pt%' then 'hr_payroll'
      when t.parent_table like '%stock%' or t.parent_table like '%inventory%' then 'inventory'
      when t.parent_table like '%report%' then 'reports'
      when t.parent_table like '%expense%' or t.parent_table like '%payment%' then 'expenses'
      else 'accounting'
    end;

    owner_policy := left(t.child_table,18)||'_'||left(t.child_column,8)||'_own_'||substr(md5(t.child_table||t.child_column),1,6);
    ca_read_policy := left(t.child_table,18)||'_'||left(t.child_column,8)||'_car_'||substr(md5(t.child_table||t.child_column),1,6);
    ca_write_policy := left(t.child_table,18)||'_'||left(t.child_column,8)||'_caw_'||substr(md5(t.child_table||t.child_column),1,6);
    user_read_policy := left(t.child_table,18)||'_'||left(t.child_column,8)||'_usr_'||substr(md5(t.child_table||t.child_column),1,6);
    user_write_policy := left(t.child_table,18)||'_'||left(t.child_column,8)||'_usw_'||substr(md5(t.child_table||t.child_column),1,6);

    execute format('alter table public.%I enable row level security',t.child_table);

    execute format('drop policy if exists %I on public.%I',owner_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.%I p where p.id=%I.%I and private.is_company_owner(p.company_id))
      ) with check (
        exists (select 1 from public.%I p where p.id=%I.%I and private.is_company_owner(p.company_id))
      )',
      owner_policy,t.child_table,t.parent_table,t.child_table,t.child_column,
      t.parent_table,t.child_table,t.child_column
    );

    execute format('drop policy if exists %I on public.%I',ca_read_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (select 1 from public.%I p where p.id=%I.%I and private.has_ca_company_access(p.company_id,false))
      )',
      ca_read_policy,t.child_table,t.parent_table,t.child_table,t.child_column
    );

    execute format('drop policy if exists %I on public.%I',ca_write_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.%I p where p.id=%I.%I and private.has_ca_company_access(p.company_id,true))
      ) with check (
        exists (select 1 from public.%I p where p.id=%I.%I and private.has_ca_company_access(p.company_id,true))
      )',
      ca_write_policy,t.child_table,t.parent_table,t.child_table,t.child_column,
      t.parent_table,t.child_table,t.child_column
    );

    execute format('drop policy if exists %I on public.%I',user_read_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (select 1 from public.%I p where p.id=%I.%I and private.has_company_user_permission(p.company_id,%L,false))
      )',
      user_read_policy,t.child_table,t.parent_table,t.child_table,t.child_column,module_key
    );

    execute format('drop policy if exists %I on public.%I',user_write_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.%I p where p.id=%I.%I and private.has_company_user_permission(p.company_id,%L,true))
      ) with check (
        exists (select 1 from public.%I p where p.id=%I.%I and private.has_company_user_permission(p.company_id,%L,true))
      )',
      user_write_policy,t.child_table,t.parent_table,t.child_table,t.child_column,module_key,
      t.parent_table,t.child_table,t.child_column,module_key
    );
  end loop;
end $$;

-- Profiles are private to the signed-in account; service-role invitation
-- provisioning remains server-side and never exposes the service key.
alter table public.profiles enable row level security;
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated using (id=(select auth.uid()));
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated with check (id=(select auth.uid()));
