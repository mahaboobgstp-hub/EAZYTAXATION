create or replace function public.import_chart_of_accounts_csv(p_company_id uuid, p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare r jsonb; gid uuid; pid uuid; gn text; gc text; ln text; lc text; nature text; nb text; sc text; ob numeric; side text; created_g integer:=0; reused_g integer:=0; created_l integer:=0; skipped_l integer:=0;
begin
 if p_company_id is null or jsonb_typeof(p_rows)<>'array' then raise exception 'Company and rows array required'; end if;
 if not exists(select 1 from public.companies where id=p_company_id and owner_user_id=auth.uid()) then raise exception 'Company access denied'; end if;
 -- First pass groups: top-level groups, then subgroups; rows can repeat group names for ledgers.
 for r in select value from jsonb_array_elements(p_rows) order by case when nullif(trim(value->>'Parent Group'),'') is null then 0 else 1 end loop
   gn:=nullif(trim(r->>'Account Group'),''); if gn is null then continue; end if;
   nature:=coalesce(nullif(trim(r->>'Account Nature'),''),'Asset');
   if nature not in ('Asset','Liability','Equity','Income','Expense') then raise exception 'Invalid account nature: %',nature; end if;
   nb:=coalesce(nullif(trim(r->>'Normal Balance'),''),case when nature in ('Asset','Expense') then 'Debit' else 'Credit' end);
   sc:=coalesce(nullif(trim(r->>'Statement Classification'),''),case when nature in ('Income','Expense') then 'Profit & Loss' else 'Balance Sheet' end);
   gc:=coalesce(nullif(trim(r->>'Group Code'),''),upper(regexp_replace(gn,'[^A-Za-z0-9]+','_','g')));
   pid:=null;
   if nullif(trim(r->>'Parent Group'),'') is not null then
     select id into pid from public.account_groups where company_id=p_company_id and lower(group_name)=lower(trim(r->>'Parent Group')) limit 1;
     if pid is null then raise exception 'Parent group not found: %',r->>'Parent Group'; end if;
   end if;
   select id into gid from public.account_groups where company_id=p_company_id and lower(group_name)=lower(gn) limit 1;
   if gid is null then
     insert into public.account_groups(company_id,group_name,group_code,parent_group_id,account_nature,normal_balance,statement_classification,description,is_active)
     values(p_company_id,gn,gc,pid,nature,nb,sc,nullif(r->>'Description',''),true) returning id into gid;
     created_g:=created_g+1;
   else reused_g:=reused_g+1; end if;
 end loop;
 for r in select value from jsonb_array_elements(p_rows) loop
   gn:=nullif(trim(r->>'Account Group'),''); ln:=nullif(trim(r->>'Ledger Name'),''); if ln is null then continue; end if;
   select id into gid from public.account_groups where company_id=p_company_id and lower(group_name)=lower(gn) limit 1;
   if gid is null then raise exception 'Account group not found for ledger %',ln; end if;
   lc:=nullif(trim(r->>'Ledger Code'),'');
   if lc is null then lc:='IMP-'||upper(substr(md5(p_company_id::text||lower(ln)||gid::text),1,10)); end if;
   if exists(select 1 from public.chart_of_accounts where company_id=p_company_id and (lower(ledger_name)=lower(ln) or ledger_code=lc)) then skipped_l:=skipped_l+1; continue; end if;
   ob:=coalesce(nullif(trim(r->>'Opening Balance'),''),'0')::numeric; side:=coalesce(nullif(trim(r->>'Opening Balance Type'),''),'Debit');
   if ob<0 or side not in ('Debit','Credit') then raise exception 'Invalid opening balance/side for ledger %',ln; end if;
   insert into public.chart_of_accounts(company_id,ledger_name,ledger_code,group_id,opening_balance,opening_balance_type,opening_date,party_type,gst_applicable,gstin,description,is_active)
   values(p_company_id,ln,lc,gid,ob,side,nullif(r->>'Opening Date','')::date,nullif(r->>'Party Type',''),coalesce(nullif(r->>'GST Applicable',''),'No') in ('Yes','yes','TRUE','true'),nullif(r->>'GSTIN',''),nullif(r->>'Description',''),true);
   created_l:=created_l+1;
 end loop;
 return jsonb_build_object('groups_created',created_g,'groups_reused',reused_g,'ledgers_created',created_l,'ledgers_skipped',skipped_l);
end $$;
grant execute on function public.import_chart_of_accounts_csv(uuid,jsonb) to authenticated;