-- FinBox / bank-feed foundation for SYD.
-- No bank credentials, access tokens, or raw provider payloads are stored here.
create table if not exists public.bank_feed_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unique (company_id, id),
  bank_account_id uuid,
  provider text not null default 'finbox' check (provider in ('finbox')),
  provider_connection_ref text,
  provider_account_ref text,
  provider_customer_ref text,
  consent_reference text,
  connection_status text not null default 'pending'
    check (connection_status in ('pending','active','expired','revoked','failed','action_required')),
  consent_started_at timestamptz,
  consent_expires_at timestamptz,
  refresh_frequency text not null default 'daily' check (refresh_frequency in ('daily','manual')),
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  last_sync_status text check (last_sync_status in ('success','partial','failed')),
  last_error_code text,
  last_error_message text,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bank_feed_connection_account_company_fk
    foreign key (company_id, bank_account_id)
    references public.bank_account_profiles(company_id, id) on delete cascade
);

create unique index if not exists bank_feed_provider_connection_ref_uidx
  on public.bank_feed_connections(provider, provider_connection_ref)
  where provider_connection_ref is not null;
create unique index if not exists bank_feed_company_account_provider_uidx
  on public.bank_feed_connections(company_id, bank_account_id, provider)
  where bank_account_id is not null;
create index if not exists bank_feed_due_sync_idx
  on public.bank_feed_connections(connection_status, next_sync_at)
  where connection_status = 'active';

alter table public.bank_statement_lines
  add column if not exists source_provider text,
  add column if not exists external_transaction_id text,
  add column if not exists bank_feed_connection_id uuid,
  add column if not exists provider_posted_at timestamptz;

alter table public.bank_statement_lines
  drop constraint if exists bank_statement_feed_connection_company_fk;
alter table public.bank_statement_lines
  add constraint bank_statement_feed_connection_company_fk
  foreign key (company_id, bank_feed_connection_id)
  references public.bank_feed_connections(company_id, id) on delete set null (bank_feed_connection_id);

create unique index if not exists bank_statement_external_txn_uidx
  on public.bank_statement_lines(company_id, bank_account_id, source_provider, external_transaction_id)
  where external_transaction_id is not null;

create table if not exists public.bank_feed_sync_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid not null,
  sync_started_at timestamptz not null default now(),
  sync_completed_at timestamptz,
  sync_status text not null default 'running'
    check (sync_status in ('running','success','partial','failed')),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  constraint bank_feed_sync_log_connection_company_fk
    foreign key (company_id, connection_id)
    references public.bank_feed_connections(company_id, id) on delete cascade
);

create index if not exists bank_feed_sync_logs_company_created_idx
  on public.bank_feed_sync_logs(company_id, created_at desc);

alter table public.bank_feed_connections enable row level security;
alter table public.bank_feed_sync_logs enable row level security;

drop policy if exists "Company owners manage bank feed connections" on public.bank_feed_connections;
create policy "Company owners manage bank feed connections"
  on public.bank_feed_connections for all to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id = bank_feed_connections.company_id
      and c.owner_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.companies c
    where c.id = bank_feed_connections.company_id
      and c.owner_user_id = (select auth.uid())
  ));

drop policy if exists "Company owners read bank feed sync logs" on public.bank_feed_sync_logs;
create policy "Company owners read bank feed sync logs"
  on public.bank_feed_sync_logs for select to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id = bank_feed_sync_logs.company_id
      and c.owner_user_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.bank_feed_connections to authenticated;
grant select on public.bank_feed_sync_logs to authenticated;
