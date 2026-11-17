alter table public.quotations
  add column if not exists tax_inclusive boolean not null default false,
  add column if not exists cess_amount numeric(14,2) not null default 0;

alter table public.quotation_items
  add column if not exists cess_rate numeric(6,2) not null default 0;
