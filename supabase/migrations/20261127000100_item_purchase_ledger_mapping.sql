-- Master-driven purchase classification: item-level purchase ledger mapping
alter table public.items
  add column if not exists purchase_ledger_id uuid references public.chart_of_accounts(id);

alter table public.purchase_invoice_items
  add column if not exists purchase_ledger_id uuid references public.chart_of_accounts(id);

create index if not exists items_company_purchase_ledger_idx
  on public.items(company_id, purchase_ledger_id);
create index if not exists purchase_invoice_items_ledger_idx
  on public.purchase_invoice_items(invoice_id, purchase_ledger_id);
