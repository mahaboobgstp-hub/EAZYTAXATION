-- Extend tenant permissions to child/detail tables that inherit their company
-- ownership through a single foreign key to a parent row with company_id.
-- Also secure the companies table and keep profiles private to their owner.

alter table public.companies enable row level security;

drop policy if exists companies_owner_all on public.companies;
create policy companies_owner_all on public.companies
  for all to authenticated
  using (owner_user_id=(select auth.uid()))
  with check (owner_user_id=(select auth.uid()));

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id=(select auth.uid()));

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id=(select auth.uid()));

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
    select
      child.relname as child_table,
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
        where c.table_schema='public' and c.table_name=child.relname
          and c.column_name='company_id'
      )
      and exists (
        select 1 from information_schema.columns p
        where p.table_schema='public' and p.table_name=parent.relname
          and p.column_name='company_id'
      )
  loop
    module_key := case
      when t.parent_table in ('customers','vendors','items','units','expense_categories','asset_categories') then 'masters'
      when t.parent_table like '%purchase%' or t.parent_table like '%vendor%' then 'purchase'
      when t.parent_table like '%sales%' or t.parent_table like '%quotation%' or t.parent_table like '%delivery_challan%' or t.parent_table like '%credit_note%' then 'sales'
      when t.parent_table like '%bank%' or t.parent_table like '%reconcil%' then 'banking'
      when t.parent_table like '%gst%' or t.parent_table like '%eway%' or t.parent_table like '%einvoice%' then 'gst'
      when t.parent_table like '%employee%' or t.parent_table like '%payroll%' or t.parent_table like '%attendance%' or t.parent_table like '%leave%' then 'hr_payroll'
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
        exists (select 1 from public.%I p join public.companies c on c.id=p.company_id
          where p.id=%I.%I and c.owner_user_id=(select auth.uid()))
      ) with check (
        exists (select 1 from public.%I p join public.companies c on c.id=p.company_id
          where p.id=%I.%I and c.owner_user_id=(select auth.uid()))
      )',
      owner_policy,t.child_table,t.parent_table,t.child_table,t.child_column,
      t.parent_table,t.child_table,t.child_column
    );

    execute format('drop policy if exists %I on public.%I',ca_read_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (select 1 from public.%I p join public.ca_company_assignments ca on ca.company_id=p.company_id
          where p.id=%I.%I and ca.ca_user_id=(select auth.uid()) and ca.status=''Active'')
      )',
      ca_read_policy,t.child_table,t.parent_table,t.child_table,t.child_column
    );

    execute format('drop policy if exists %I on public.%I',ca_write_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.%I p join public.ca_company_assignments ca on ca.company_id=p.company_id
          where p.id=%I.%I and ca.ca_user_id=(select auth.uid())
            and ca.status=''Active'' and ca.access_level=''read_write'')
      ) with check (
        exists (select 1 from public.%I p join public.ca_company_assignments ca on ca.company_id=p.company_id
          where p.id=%I.%I and ca.ca_user_id=(select auth.uid())
            and ca.status=''Active'' and ca.access_level=''read_write'')
      )',
      ca_write_policy,t.child_table,t.parent_table,t.child_table,t.child_column,
      t.parent_table,t.child_table,t.child_column
    );

    execute format('drop policy if exists %I on public.%I',user_read_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (select 1 from public.%I p join public.company_user_access ua on ua.company_id=p.company_id
          where p.id=%I.%I and ua.user_id=(select auth.uid()) and ua.status=''Active''
            and coalesce((ua.permissions -> %L ->> ''read'')::boolean,false))
      )',
      user_read_policy,t.child_table,t.parent_table,t.child_table,t.child_column,module_key
    );

    execute format('drop policy if exists %I on public.%I',user_write_policy,t.child_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.%I p join public.company_user_access ua on ua.company_id=p.company_id
          where p.id=%I.%I and ua.user_id=(select auth.uid()) and ua.status=''Active''
            and coalesce((ua.permissions -> %L ->> ''write'')::boolean,false))
      ) with check (
        exists (select 1 from public.%I p join public.company_user_access ua on ua.company_id=p.company_id
          where p.id=%I.%I and ua.user_id=(select auth.uid()) and ua.status=''Active''
            and coalesce((ua.permissions -> %L ->> ''write'')::boolean,false))
      )',
      user_write_policy,t.child_table,t.parent_table,t.child_table,t.child_column,module_key,
      t.parent_table,t.child_table,t.child_column,module_key
    );
  end loop;
end $$;
