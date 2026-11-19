alter table public.purchase_invoices
  add column if not exists purchase_type text not null default 'Goods';
