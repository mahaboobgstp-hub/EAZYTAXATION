-- Assigned staff members can load the company shell only when they have an active grant.
drop policy if exists companies_assigned_user_read on public.companies;
create policy companies_assigned_user_read on public.companies
  for select to authenticated
  using (exists (
    select 1 from public.company_user_access ua
    where ua.company_id=companies.id
      and ua.user_id=(select auth.uid())
      and ua.status='Active'
  ));
