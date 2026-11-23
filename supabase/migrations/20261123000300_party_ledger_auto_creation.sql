alter table public.customers
  add column if not exists ledger_id uuid,
  add column if not exists ledger_code text;
alter table public.vendors
  add column if not exists ledger_id uuid,
  add column if not exists ledger_code text;

create or replace function public.create_party_with_ledger(
  p_company_id uuid,
  p_party_kind text,
  p_payload jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_party_id uuid;
  v_ledger_id uuid;
  v_group_id uuid;
  v_parent_id uuid;
  v_group_name text;
  v_group_code text;
  v_parent_name text;
  v_parent_code text;
  v_ledger_name text;
  v_prefix text;
  v_party_code_prefix text;
  v_next integer;
  v_ledger_code text;
  v_party_code text;
  v_opening numeric(18,2);
  v_opening_side text;
  v_gstin text;
  v_party jsonb;
begin
  if p_party_kind not in ('customer','vendor') then
    raise exception 'Party type must be customer or vendor';
  end if;
  if p_company_id is null or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Company and party payload are required';
  end if;
  if not exists(select 1 from public.companies where id=p_company_id and owner_user_id=auth.uid()) then
    raise exception 'Company access denied';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_company_id::text || ':' || p_party_kind));

  if p_party_kind='customer' then
    v_group_name:='Sundry Debtors'; v_group_code:='SDR';
    v_parent_name:='Assets'; v_parent_code:='AST';
    v_prefix:='11'; v_party_code_prefix:='CUST-';
    v_ledger_name:=nullif(trim(p_payload->>'customer_name'),'');
    if v_ledger_name is null then raise exception 'Customer name is required'; end if;
    v_opening:=coalesce(nullif(p_payload->>'opening_balance','')::numeric,0);
    v_opening_side:=coalesce(nullif(p_payload->>'opening_balance_type',''),'Debit');
    v_gstin:=nullif(p_payload->>'gstin','');
  else
    v_group_name:='Sundry Creditors'; v_group_code:='SCR';
    v_parent_name:='Liabilities'; v_parent_code:='LIA';
    v_prefix:='21'; v_party_code_prefix:='VEND-';
    v_ledger_name:=nullif(trim(p_payload->>'vendor_name'),'');
    if v_ledger_name is null then raise exception 'Vendor name is required'; end if;
    v_opening:=coalesce(nullif(p_payload->>'opening_balance','')::numeric,0);
    v_opening_side:=coalesce(nullif(p_payload->>'opening_balance_type',''),'Credit');
    v_gstin:=nullif(p_payload->>'gstin','');
  end if;
  if v_opening < 0 or v_opening_side not in ('Debit','Credit') then
    raise exception 'Opening balance or balance type is invalid';
  end if;

  select id into v_parent_id from public.account_groups
    where company_id=p_company_id and lower(group_name)=lower(v_parent_name) limit 1;
  if v_parent_id is null then
    insert into public.account_groups(company_id,group_name,group_code,account_nature,normal_balance,statement_classification,is_system,is_active)
    values(p_company_id,v_parent_name,v_parent_code,
      case when v_parent_name='Assets' then 'Asset' else 'Liability' end,
      case when v_parent_name='Assets' then 'Debit' else 'Credit' end,
      'Balance Sheet',true,true)
    returning id into v_parent_id;
  end if;

  select id into v_group_id from public.account_groups
    where company_id=p_company_id and lower(group_name)=lower(v_group_name) limit 1;
  if v_group_id is null then
    insert into public.account_groups(company_id,group_name,group_code,parent_group_id,account_nature,normal_balance,statement_classification,description,is_system,is_active)
    values(p_company_id,v_group_name,v_group_code,v_parent_id,
      case when p_party_kind='customer' then 'Asset' else 'Liability' end,
      case when p_party_kind='customer' then 'Debit' else 'Credit' end,
      'Balance Sheet','Party control group',true,true)
    returning id into v_group_id;
  end if;

  if p_party_kind='customer' then
    select coalesce(max((substring(ledger_code from 3))::integer),0)+1 into v_next
      from public.chart_of_accounts where company_id=p_company_id and ledger_code ~ '^11[0-9]{4}$';
  else
    select coalesce(max((substring(ledger_code from 3))::integer),0)+1 into v_next
      from public.chart_of_accounts where company_id=p_company_id and ledger_code ~ '^21[0-9]{4}$';
  end if;
  v_ledger_code:=v_prefix||lpad(v_next::text,4,'0');
  if p_party_kind='customer' then
    v_party_code:=coalesce(nullif(trim(p_payload->>'customer_code'),''),v_party_code_prefix||lpad(v_next::text,4,'0'));
    insert into public.customers
    select (jsonb_populate_record(null::public.customers,
      p_payload || jsonb_build_object('company_id',p_company_id,'customer_code',v_party_code,'ledger_code',v_ledger_code))).*
    returning id into v_party_id;
  else
    v_party_code:=coalesce(nullif(trim(p_payload->>'vendor_code'),''),v_party_code_prefix||lpad(v_next::text,4,'0'));
    insert into public.vendors
    select (jsonb_populate_record(null::public.vendors,
      p_payload || jsonb_build_object('company_id',p_company_id,'vendor_code',v_party_code,'ledger_code',v_ledger_code))).*
    returning id into v_party_id;
  end if;

  insert into public.chart_of_accounts(company_id,ledger_name,ledger_code,group_id,opening_balance,opening_balance_type,party_type,linked_party_id,gst_applicable,gstin,description,is_active)
  values(p_company_id,v_ledger_name,v_ledger_code,v_group_id,v_opening,v_opening_side,
    case when p_party_kind='customer' then 'Customer' else 'Supplier' end,
    v_party_id,coalesce((p_payload->>'gst_registered')::boolean,false),v_gstin,
    'Auto-created party ledger',true)
  returning id into v_ledger_id;

  if p_party_kind='customer' then
    update public.customers set ledger_id=v_ledger_id,ledger_code=v_ledger_code where id=v_party_id and company_id=p_company_id;
    select to_jsonb(c) into v_party from public.customers c where id=v_party_id and company_id=p_company_id;
  else
    update public.vendors set ledger_id=v_ledger_id,ledger_code=v_ledger_code where id=v_party_id and company_id=p_company_id;
    select to_jsonb(v) into v_party from public.vendors v where id=v_party_id and company_id=p_company_id;
  end if;
  return v_party;
end;
$$;

revoke all on function public.create_party_with_ledger(uuid,text,jsonb) from public;
grant execute on function public.create_party_with_ledger(uuid,text,jsonb) to authenticated;
