alter table public.sales_orders
  add column if not exists cgst numeric(14,2) not null default 0,
  add column if not exists sgst numeric(14,2) not null default 0,
  add column if not exists igst numeric(14,2) not null default 0;

alter table public.credit_notes
  add column if not exists cgst numeric(14,2) not null default 0,
  add column if not exists sgst numeric(14,2) not null default 0,
  add column if not exists igst numeric(14,2) not null default 0;