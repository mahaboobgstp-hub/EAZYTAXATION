-- Idempotent balanced voucher posting RPC for source transactions.
-- Posting services build accounting lines; this function validates company ownership,
-- ledger ownership, balanced totals, and source idempotency before writing.

create unique index if not exists accounting_vouchers_source_unique
  on public.accounting_vouchers(company_id, source_module, source_record_id)
  where source_record_id is not null and source_module is not null;

create or replace function public.post_accounting_source_voucher(
  p_company_id uuid,
  p_source_module text,
  p_source_record_id uuid,
  p_voucher_type text,
  p_voucher_date date,
  p_reference_number text,
  p_narration text,
  p_lines jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing uuid;
  v_voucher_id uuid;
  v_debit numeric(18,2);
  v_credit numeric(18,2);
  v_line_count integer;
  v_line jsonb;
  v_line_no integer := 0;
begin
  if p_company_id is null or p_source_module not in ('Purchase','Sales','Bank') or p_source_record_id is null then
    raise exception 'Company, supported source module, and source record are required';
  end if;
  if not exists(select 1 from public.companies where id=p_company_id and owner_user_id=auth.uid()) then
    raise exception 'Company access denied for accounting voucher posting';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'A voucher must contain at least two accounting lines';
  end if;

  select id into v_existing from accounting_vouchers
   where company_id=p_company_id and source_module=p_source_module and source_record_id=p_source_record_id
   limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select count(*), coalesce(sum((x->>'debit')::numeric),0), coalesce(sum((x->>'credit')::numeric),0)
    into v_line_count, v_debit, v_credit
    from jsonb_array_elements(p_lines) x;
  if v_line_count < 2 or v_debit <= 0 or round(v_debit,2) <> round(v_credit,2) then
    raise exception 'Voucher lines are not balanced. Debit % Credit %',v_debit,v_credit;
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    if coalesce((v_line->>'ledger_id')::uuid,null) is null then
      raise exception 'Each voucher line must have a ledger';
    end if;
    if not exists(select 1 from chart_of_accounts where id=(v_line->>'ledger_id')::uuid and company_id=p_company_id and is_active=true) then
      raise exception 'Ledger does not belong to selected company or is inactive';
    end if;
    if coalesce((v_line->>'debit')::numeric,0) < 0 or coalesce((v_line->>'credit')::numeric,0) < 0 then
      raise exception 'Debit and credit values cannot be negative';
    end if;
    if coalesce((v_line->>'debit')::numeric,0) > 0 and coalesce((v_line->>'credit')::numeric,0) > 0 then
      raise exception 'A voucher line cannot contain both debit and credit';
    end if;
  end loop;

  insert into accounting_vouchers(company_id,voucher_number,voucher_type,voucher_date,reference_number,narration,source_module,source_record_id,status,total_debit,total_credit)
  values(p_company_id,'SRC-'||upper(substr(p_source_module,1,3))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,12),p_voucher_type,p_voucher_date,p_reference_number,p_narration,p_source_module,p_source_record_id,'Posted',round(v_debit,2),round(v_credit,2))
  returning id into v_voucher_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_line_no := v_line_no + 1;
    insert into accounting_voucher_lines(company_id,voucher_id,ledger_id,line_number,debit,credit,line_narration,cost_centre)
    values(p_company_id,v_voucher_id,(v_line->>'ledger_id')::uuid,v_line_no,coalesce((v_line->>'debit')::numeric,0),coalesce((v_line->>'credit')::numeric,0),coalesce(v_line->>'narration',p_narration),v_line->>'cost_centre');
  end loop;
  return v_voucher_id;
end;
$$;

grant execute on function public.post_accounting_source_voucher(uuid,text,uuid,text,date,text,text,jsonb) to authenticated;
