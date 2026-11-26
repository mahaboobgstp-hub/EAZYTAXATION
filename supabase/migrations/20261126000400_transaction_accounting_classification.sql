-- Accounting classification foundation for source transactions
alter table public.vendors
  add column if not exists default_purchase_ledger_id uuid references public.chart_of_accounts(id);
alter table public.customers
  add column if not exists default_sales_ledger_id uuid references public.chart_of_accounts(id);
alter table public.purchase_invoices
  add column if not exists purchase_ledger_id uuid references public.chart_of_accounts(id),
  add column if not exists accounting_classification_status text not null default 'Uncategorized',
  add column if not exists accounting_status text not null default 'Unposted',
  add column if not exists accounting_message text,
  add column if not exists accounting_voucher_id uuid references public.accounting_vouchers(id);
alter table public.sales_invoices
  add column if not exists sales_ledger_id uuid references public.chart_of_accounts(id),
  add column if not exists accounting_classification_status text not null default 'Uncategorized';

create table if not exists public.transaction_accounting_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_module text not null check (source_module in ('Purchase','Sales','Bank')),
  match_type text not null check (match_type in ('Supplier','Customer','NarrationKeyword','Item')),
  match_value text not null,
  debit_ledger_id uuid references public.chart_of_accounts(id),
  credit_ledger_id uuid references public.chart_of_accounts(id),
  gst_ledger_ids jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  auto_apply boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id,source_module,match_type,match_value)
);
alter table public.transaction_accounting_rules enable row level security;
drop policy if exists "Company users manage transaction accounting rules" on public.transaction_accounting_rules;
create policy "Company users manage transaction accounting rules" on public.transaction_accounting_rules
for all using (exists(select 1 from public.companies c where c.id=transaction_accounting_rules.company_id and c.owner_user_id=auth.uid()))
with check (exists(select 1 from public.companies c where c.id=transaction_accounting_rules.company_id and c.owner_user_id=auth.uid()));
grant select,insert,update,delete on public.transaction_accounting_rules to authenticated;
create index if not exists transaction_accounting_rules_company_module_idx on public.transaction_accounting_rules(company_id,source_module,is_active,priority);
