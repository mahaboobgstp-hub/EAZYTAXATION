drop policy if exists "Authenticated users manage shared asset categories" on public.asset_categories;
drop policy if exists asset_categories_read_access on public.asset_categories;
drop policy if exists asset_categories_company_write on public.asset_categories;
create policy asset_categories_read_access on public.asset_categories for select to authenticated
using (company_id is null or private.is_company_owner(company_id) or private.has_company_user_permission(company_id,'accounting',false) or private.has_company_user_permission(company_id,'hr',false) or private.has_ca_company_access(company_id,false));
create policy asset_categories_company_write on public.asset_categories for all to authenticated
using (company_id is not null and (private.is_company_owner(company_id) or private.has_company_user_permission(company_id,'accounting',false) or private.has_company_user_permission(company_id,'hr',false) or private.has_ca_company_access(company_id,false)))
with check (company_id is not null and (private.is_company_owner(company_id) or private.has_company_user_permission(company_id,'accounting',true) or private.has_company_user_permission(company_id,'hr',true) or private.has_ca_company_access(company_id,true)));