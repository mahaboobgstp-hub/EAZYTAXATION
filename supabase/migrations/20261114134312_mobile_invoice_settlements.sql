create unique index if not exists sales_invoices_company_id_id_uidx on public.sales_invoices(company_id,id);
create unique index if not exists purchase_invoices_company_id_id_uidx on public.purchase_invoices(company_id,id);
create table if not exists public.sales_invoice_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null,
  voucher_id uuid not null,
  receipt_date date not null,
  amount numeric(18,2) not null check (amount > 0),
  payment_method text not null default 'Bank Transfer',
  bank_ledger_id uuid,
  reference_number text,
  created_at timestamptz not null default now(),
  constraint sales_receipt_invoice_company_fk foreign key(company_id,invoice_id) references public.sales_invoices(company_id,id) on delete cascade,
  constraint sales_receipt_voucher_company_fk foreign key(company_id,voucher_id) references public.accounting_vouchers(company_id,id) on delete restrict,
  constraint sales_receipt_bank_ledger_company_fk foreign key(company_id,bank_ledger_id) references public.chart_of_accounts(company_id,id) on delete restrict
);
create table if not exists public.purchase_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null,
  voucher_id uuid not null,
  payment_date date not null,
  amount numeric(18,2) not null check (amount > 0),
  payment_method text not null default 'Bank Transfer',
  bank_ledger_id uuid,
  reference_number text,
  created_at timestamptz not null default now(),
  constraint purchase_payment_invoice_company_fk foreign key(company_id,invoice_id) references public.purchase_invoices(company_id,id) on delete cascade,
  constraint purchase_payment_voucher_company_fk foreign key(company_id,voucher_id) references public.accounting_vouchers(company_id,id) on delete restrict,
  constraint purchase_payment_bank_ledger_company_fk foreign key(company_id,bank_ledger_id) references public.chart_of_accounts(company_id,id) on delete restrict
);
create index if not exists sales_invoice_receipts_company_date_idx on public.sales_invoice_receipts(company_id,receipt_date desc);
create index if not exists sales_invoice_receipts_invoice_idx on public.sales_invoice_receipts(company_id,invoice_id);
create index if not exists purchase_invoice_payments_company_date_idx on public.purchase_invoice_payments(company_id,payment_date desc);
create index if not exists purchase_invoice_payments_invoice_idx on public.purchase_invoice_payments(company_id,invoice_id);
alter table public.sales_invoice_receipts enable row level security;
alter table public.purchase_invoice_payments enable row level security;
create policy "Company owners manage sales invoice receipts" on public.sales_invoice_receipts for all to authenticated
using (exists (select 1 from public.companies c where c.id=sales_invoice_receipts.company_id and c.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.companies c where c.id=sales_invoice_receipts.company_id and c.owner_user_id=(select auth.uid())));
create policy "Company owners manage purchase invoice payments" on public.purchase_invoice_payments for all to authenticated
using (exists (select 1 from public.companies c where c.id=purchase_invoice_payments.company_id and c.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.companies c where c.id=purchase_invoice_payments.company_id and c.owner_user_id=(select auth.uid())));
grant select,insert,update,delete on public.sales_invoice_receipts to authenticated;
grant select,insert,update,delete on public.purchase_invoice_payments to authenticated;