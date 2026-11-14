create table if not exists public.bank_account_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ledger_id uuid not null,
  bank_name text not null,
  account_holder_name text,
  account_number_masked text,
  ifsc text,
  branch_name text,
  account_type text not null default 'Current',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, ledger_id),
  constraint bank_profile_ledger_company_fk foreign key (company_id, ledger_id)
    references public.chart_of_accounts(company_id, id) on delete cascade
);
create table if not exists public.bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bank_account_id uuid not null,
  statement_date date not null,
  narration text not null,
  reference_number text,
  amount numeric(18,2) not null check (amount > 0),
  direction text not null check (direction in ('Credit','Debit')),
  running_balance numeric(18,2),
  match_status text not null default 'Unmatched' check (match_status in ('Unmatched','Matched','Ignored')),
  matched_voucher_id uuid,
  matched_at timestamptz,
  import_batch text,
  created_at timestamptz not null default now(),
  constraint bank_statement_account_company_fk foreign key (company_id, bank_account_id)
    references public.bank_account_profiles(company_id, id) on delete cascade,
  constraint bank_statement_voucher_company_fk foreign key (company_id, matched_voucher_id)
    references public.accounting_vouchers(company_id, id) on delete set null
);
create index if not exists bank_statement_company_date_idx on public.bank_statement_lines(company_id, bank_account_id, statement_date desc);
create index if not exists bank_statement_match_idx on public.bank_statement_lines(company_id, match_status);
create table if not exists public.gst_document_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_type text not null check (source_type in ('Sales Invoice','Delivery Challan')),
  source_id uuid not null,
  document_type text not null check (document_type in ('E-Invoice','E-Way Bill')),
  reference_number text,
  acknowledgement_number text,
  status text not null default 'Pending' check (status in ('Pending','Issued','Cancelled','Failed','Manually Recorded')),
  issued_at timestamptz,
  notes text,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, source_type, source_id, document_type)
);
create index if not exists gst_document_records_company_type_idx on public.gst_document_records(company_id, document_type, status);
alter table public.bank_account_profiles enable row level security;
alter table public.bank_statement_lines enable row level security;
alter table public.gst_document_records enable row level security;
create policy "Company owners manage bank account profiles" on public.bank_account_profiles for all to authenticated
using (exists (select 1 from public.companies c where c.id=bank_account_profiles.company_id and c.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.companies c where c.id=bank_account_profiles.company_id and c.owner_user_id=(select auth.uid())));
create policy "Company owners manage bank statement lines" on public.bank_statement_lines for all to authenticated
using (exists (select 1 from public.companies c where c.id=bank_statement_lines.company_id and c.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.companies c where c.id=bank_statement_lines.company_id and c.owner_user_id=(select auth.uid())));
create policy "Company owners manage GST document records" on public.gst_document_records for all to authenticated
using (exists (select 1 from public.companies c where c.id=gst_document_records.company_id and c.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.companies c where c.id=gst_document_records.company_id and c.owner_user_id=(select auth.uid())));
grant select,insert,update,delete on public.bank_account_profiles to authenticated;
grant select,insert,update,delete on public.bank_statement_lines to authenticated;
grant select,insert,update,delete on public.gst_document_records to authenticated;