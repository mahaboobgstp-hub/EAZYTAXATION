-- Apply module-level permissions to invited company users.
-- Permissions JSON shape: { "sales": { "read": true, "write": false }, ... }
do $$
declare
  t record;
  module_key text;
  read_policy text;
  write_policy text;
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
      when t.table_name in ('customers','vendors','items','units_of_measure','uom','expense_categories','asset_categories','gst_rates') then 'masters'
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
    read_policy := t.table_name || '_assigned_user_read';
    write_policy := t.table_name || '_assigned_user_write';

    execute format('drop policy if exists %I on public.%I',read_policy,t.table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (select 1 from public.company_user_access ua
          where ua.company_id=%I.company_id
            and ua.user_id=(select auth.uid())
            and ua.status=''Active''
            and coalesce((ua.permissions -> %L ->> ''read'')::boolean,false))
      )',
      read_policy,t.table_name,t.table_name,module_key
    );

    execute format('drop policy if exists %I on public.%I',write_policy,t.table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (select 1 from public.company_user_access ua
          where ua.company_id=%I.company_id
            and ua.user_id=(select auth.uid())
            and ua.status=''Active''
            and coalesce((ua.permissions -> %L ->> ''write'')::boolean,false))
      ) with check (
        exists (select 1 from public.company_user_access ua
          where ua.company_id=%I.company_id
            and ua.user_id=(select auth.uid())
            and ua.status=''Active''
            and coalesce((ua.permissions -> %L ->> ''write'')::boolean,false))
      )',
      write_policy,t.table_name,t.table_name,module_key,t.table_name,module_key
    );
  end loop;
end $$;
