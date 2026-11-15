-- Bank feed access follows SYD's existing owner / assigned-user / CA Banking permissions.
drop policy if exists "Company owners manage bank feed connections" on public.bank_feed_connections;
drop policy if exists "bank_feed_connections_assigned_read" on public.bank_feed_connections;
drop policy if exists "bank_feed_connections_assigned_write" on public.bank_feed_connections;
drop policy if exists "bank_feed_connections_ca_read" on public.bank_feed_connections;
drop policy if exists "bank_feed_connections_ca_write" on public.bank_feed_connections;
drop policy if exists "bank_feed_sync_logs_assigned_read" on public.bank_feed_sync_logs;
drop policy if exists "bank_feed_sync_logs_ca_read" on public.bank_feed_sync_logs;

create policy "bank_feed_connections_assigned_read"
on public.bank_feed_connections for select to authenticated
using (private.has_company_user_permission(company_id, 'banking', false));

create policy "bank_feed_connections_assigned_write"
on public.bank_feed_connections for all to authenticated
using (private.has_company_user_permission(company_id, 'banking', true))
with check (private.has_company_user_permission(company_id, 'banking', true));

create policy "bank_feed_connections_ca_read"
on public.bank_feed_connections for select to authenticated
using (private.has_ca_company_access(company_id, false));

create policy "bank_feed_connections_ca_write"
on public.bank_feed_connections for all to authenticated
using (private.has_ca_company_access(company_id, true))
with check (private.has_ca_company_access(company_id, true));

create policy "bank_feed_sync_logs_assigned_read"
on public.bank_feed_sync_logs for select to authenticated
using (private.has_company_user_permission(company_id, 'banking', false));

create policy "bank_feed_sync_logs_ca_read"
on public.bank_feed_sync_logs for select to authenticated
using (private.has_ca_company_access(company_id, false));
