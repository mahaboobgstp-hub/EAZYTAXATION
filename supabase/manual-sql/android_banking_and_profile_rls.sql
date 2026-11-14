-- Applied directly to Supabase project evycypxcgbnovkbkhmfu.
-- Kept here as a versioned record; this file is not an auto-run migration.
-- These policies preserve owner access and allow only company users with
-- explicit Banking read/write permissions and assigned CAs with permitted access.

create policy "bank_account_profiles_assigned_read"
on public.bank_account_profiles for select to authenticated
using (private.has_company_user_permission(company_id, 'banking', false));

create policy "bank_account_profiles_assigned_write"
on public.bank_account_profiles for all to authenticated
using (private.has_company_user_permission(company_id, 'banking', true))
with check (private.has_company_user_permission(company_id, 'banking', true));

create policy "bank_account_profiles_ca_read"
on public.bank_account_profiles for select to authenticated
using (private.has_ca_company_access(company_id, false));

create policy "bank_account_profiles_ca_write"
on public.bank_account_profiles for all to authenticated
using (private.has_ca_company_access(company_id, true))
with check (private.has_ca_company_access(company_id, true));

create policy "bank_statement_lines_assigned_read"
on public.bank_statement_lines for select to authenticated
using (private.has_company_user_permission(company_id, 'banking', false));

create policy "bank_statement_lines_assigned_write"
on public.bank_statement_lines for all to authenticated
using (private.has_company_user_permission(company_id, 'banking', true))
with check (private.has_company_user_permission(company_id, 'banking', true));

create policy "bank_statement_lines_ca_read"
on public.bank_statement_lines for select to authenticated
using (private.has_ca_company_access(company_id, false));

create policy "bank_statement_lines_ca_write"
on public.bank_statement_lines for all to authenticated
using (private.has_ca_company_access(company_id, true))
with check (private.has_ca_company_access(company_id, true));

-- Profiles can only be updated by the authenticated owner of that profile.
create policy "profiles_self_update"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
