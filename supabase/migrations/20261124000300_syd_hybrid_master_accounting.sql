-- SYD Hybrid Master-to-Accounting safeguards and item classification
-- Master creation only creates linked ledgers when accounting is enabled and an existing COA is present.
-- Party ledger creation requires the user-selected hierarchy and is company-scoped.

alter table public.items add column if not exists accounting_item_type text;
alter table public.items add column if not exists inventory_ledger_id uuid;
alter table public.items add column if not exists purchase_ledger_id uuid;
alter table public.items add column if not exists sales_ledger_id uuid;
alter table public.items add column if not exists cogs_ledger_id uuid;
alter table public.items add column if not exists consumption_ledger_id uuid;

alter table public.items drop constraint if exists items_inventory_ledger_company_fk;
alter table public.items drop constraint if exists items_purchase_ledger_company_fk;
alter table public.items drop constraint if exists items_sales_ledger_company_fk;
alter table public.items drop constraint if exists items_cogs_ledger_company_fk;
alter table public.items drop constraint if exists items_consumption_ledger_company_fk;

alter table public.items
  add constraint items_inventory_ledger_company_fk
  foreign key (company_id, inventory_ledger_id)
  references public.chart_of_accounts(company_id, id) on delete restrict;
alter table public.items
  add constraint items_purchase_ledger_company_fk
  foreign key (company_id, purchase_ledger_id)
  references public.chart_of_accounts(company_id, id) on delete restrict;
alter table public.items
  add constraint items_sales_ledger_company_fk
  foreign key (company_id, sales_ledger_id)
  references public.chart_of_accounts(company_id, id) on delete restrict;
alter table public.items
  add constraint items_cogs_ledger_company_fk
  foreign key (company_id, cogs_ledger_id)
  references public.chart_of_accounts(company_id, id) on delete restrict;
alter table public.items
  add constraint items_consumption_ledger_company_fk
  foreign key (company_id, consumption_ledger_id)
  references public.chart_of_accounts(company_id, id) on delete restrict;

create index if not exists items_company_inventory_ledger_idx on public.items(company_id, inventory_ledger_id);

comment on column public.items.accounting_item_type is 'Accounting classification for inventory-aware companies; not a ledger.';
comment on column public.items.inventory_ledger_id is 'Optional linked posting ledger for item stock classification.';

create or replace function public.create_party_with_ledger(
  p_company_id uuid,
  p_party_kind text,
  p_payload jsonb
) returns jsonb
language plpgsql security invoker set search_path=public
as $$
declare
  v_party_id uuid; v_ledger_id uuid; v_group_id uuid;
  v_main_group_id uuid; v_intermediate_group_id uuid; v_subgroup_id uuid;
  v_group_name text; v_group_code text; v_ledger_name text;
  v_prefix text; v_next integer; v_ledger_code text; v_party_code text;
  v_opening numeric(18,2); v_opening_side text; v_gstin text;
  v_party jsonb; v_accounting_enabled boolean; v_has_coa boolean; v_group_nature text;
begin
  if p_party_kind not in ('customer','vendor') then raise exception 'Party type must be customer or vendor'; end if;
  if p_company_id is null or p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'Company and party payload are required'; end if;
  if not exists(select 1 from public.companies where id=p_company_id and owner_user_id=auth.uid()) then raise exception 'Company access denied'; end if;
  perform pg_advisory_xact_lock(hashtext(p_company_id::text || ':party_master'));
  select coalesce(accounting_enabled,false) into v_accounting_enabled from public.companies where id=p_company_id;
  select exists(select 1 from public.chart_of_accounts where company_id=p_company_id) into v_has_coa;
  v_accounting_enabled := v_accounting_enabled and v_has_coa;

  if p_party_kind='customer' then
    v_prefix:='11';v_ledger_name:=nullif(trim(p_payload->>'customer_name'),'');
    if v_ledger_name is null then raise exception 'Customer name is required'; end if;
    v_opening:=coalesce(nullif(p_payload->>'opening_balance','')::numeric,0);
    v_opening_side:=coalesce(nullif(p_payload->>'opening_balance_type',''),'Debit');
    v_gstin:=nullif(upper(regexp_replace(p_payload->>'gstin','[^A-Za-z0-9]','','g')),'');
  else
    v_prefix:='21';v_ledger_name:=nullif(trim(p_payload->>'vendor_name'),'');
    if v_ledger_name is null then raise exception 'Vendor name is required'; end if;
    v_opening:=coalesce(nullif(p_payload->>'opening_balance','')::numeric,0);
    v_opening_side:=coalesce(nullif(p_payload->>'opening_balance_type',''),'Credit');
    v_gstin:=nullif(upper(regexp_replace(p_payload->>'gstin','[^A-Za-z0-9]','','g')),'');
  end if;
  if v_opening<0 or v_opening_side not in ('Debit','Credit') then raise exception 'Opening balance or balance type is invalid'; end if;
  if v_gstin is not null then
    if exists(select 1 from public.customers where company_id=p_company_id and upper(regexp_replace(coalesce(gstin,''),'[^A-Za-z0-9]','','g'))=v_gstin)
       or exists(select 1 from public.vendors where company_id=p_company_id and upper(regexp_replace(coalesce(gstin,''),'[^A-Za-z0-9]','','g'))=v_gstin) then
      raise exception 'GSTIN already exists in this company. Review the existing party before creating a duplicate.';
    end if;
  end if;

  if p_party_kind='customer' then
    v_party_code:=coalesce(nullif(trim(p_payload->>'customer_code'),''),'CUST-'||substr(md5(gen_random_uuid()::text),1,8));
    insert into public.customers select (jsonb_populate_record(null::public.customers,p_payload||jsonb_build_object('company_id',p_company_id,'customer_code',v_party_code,'created_at',now()))).* returning id into v_party_id;
    select to_jsonb(c) into v_party from public.customers c where id=v_party_id and company_id=p_company_id;
  else
    v_party_code:=coalesce(nullif(trim(p_payload->>'vendor_code'),''),'VEND-'||substr(md5(gen_random_uuid()::text),1,8));
    insert into public.vendors select (jsonb_populate_record(null::public.vendors,p_payload||jsonb_build_object('company_id',p_company_id,'vendor_code',v_party_code,'created_at',now()))).* returning id into v_party_id;
    select to_jsonb(v) into v_party from public.vendors v where id=v_party_id and company_id=p_company_id;
  end if;

  if not v_accounting_enabled then return v_party; end if;
  v_main_group_id:=nullif(p_payload->>'main_group_id','')::uuid;
  v_intermediate_group_id:=nullif(p_payload->>'intermediate_group_id','')::uuid;
  v_subgroup_id:=nullif(p_payload->>'subgroup_id','')::uuid;
  if v_main_group_id is null and v_intermediate_group_id is null and v_subgroup_id is null then return v_party; end if;
  if v_main_group_id is null then raise exception 'Select a main account group.'; end if;
  select account_nature into v_group_nature from public.account_groups where company_id=p_company_id and id=v_main_group_id and parent_group_id is null and is_active=true;
  if v_group_nature is null then raise exception 'Selected main group is invalid for this company.'; end if;
  if (p_party_kind='customer' and v_group_nature<>'Asset') or (p_party_kind='vendor' and v_group_nature<>'Liability') then raise exception 'Select a main group compatible with the party type.'; end if;
  v_group_id:=v_main_group_id;
  if v_intermediate_group_id is not null then
    if not exists(select 1 from public.account_groups where company_id=p_company_id and id=v_intermediate_group_id and parent_group_id=v_main_group_id and is_active=true) then raise exception 'Intermediate group does not belong to the selected main group.'; end if;
    v_group_id:=v_intermediate_group_id;
  end if;
  if v_subgroup_id is not null then
    if v_intermediate_group_id is null or not exists(select 1 from public.account_groups where company_id=p_company_id and id=v_subgroup_id and parent_group_id=v_intermediate_group_id and is_active=true) then raise exception 'Subgroup does not belong to the selected intermediate group.'; end if;
    v_group_id:=v_subgroup_id;
  end if;

  if p_party_kind='customer' then
    select coalesce(max(substring(ledger_code from 3)::integer),0)+1 into v_next from public.chart_of_accounts where company_id=p_company_id and ledger_code ~ '^11[0-9]{4}$';
  else
    select coalesce(max(substring(ledger_code from 3)::integer),0)+1 into v_next from public.chart_of_accounts where company_id=p_company_id and ledger_code ~ '^21[0-9]{4}$';
  end if;
  v_ledger_code:=v_prefix||lpad(v_next::text,4,'0');
  insert into public.chart_of_accounts(company_id,ledger_name,ledger_code,group_id,parent_ledger_id,ledger_level,is_posting_enabled,opening_balance,opening_balance_type,party_type,linked_party_id,gst_applicable,gstin,description,is_active)
  values(p_company_id,v_ledger_name,v_ledger_code,v_group_id,null,'Main Ledger',true,v_opening,v_opening_side,
    case when p_party_kind='customer' then 'Customer' else 'Supplier' end,v_party_id,
    coalesce((p_payload->>'gst_registered')::boolean,false),v_gstin,'Auto-created party ledger',true)
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
