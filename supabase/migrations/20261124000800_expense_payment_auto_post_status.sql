alter table public.expense_payments add column if not exists accounting_status text not null default 'Not Posted';
alter table public.expense_payments add column if not exists accounting_message text;
alter table public.expense_payments add column if not exists accounting_voucher_id uuid references public.accounting_vouchers(id) on delete set null;
create index if not exists expense_payments_company_accounting_status_idx on public.expense_payments(company_id,accounting_status);