alter table public.purchase_invoices
  add column if not exists gst_treatment text not null default 'Regular Supplier (Registered)';

alter table public.purchase_orders
  add column if not exists item_count integer not null default 0;