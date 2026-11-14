alter table public.quotations
  add column if not exists status text not null default 'Draft',
  add column if not exists valid_until date;

alter table public.delivery_challans
  add column if not exists sales_order_id uuid,
  add column if not exists sales_order_no text;

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  order_no text not null,
  order_date date not null default current_date,
  expected_delivery_date date,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  taxable_value numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'Open',
  fulfillment_status text not null default 'Pending',
  remarks text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, order_no)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_orders(id) on delete cascade,
  line_no integer not null default 1,
  item_id uuid,
  item_name text not null,
  description text,
  hsn_sac text,
  unit text,
  qty numeric(14,3) not null default 1,
  rate numeric(14,2) not null default 0,
  gst_rate numeric(6,2) not null default 0,
  amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  credit_note_no text not null,
  credit_note_date date not null default current_date,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  original_invoice_id uuid references public.sales_invoices(id),
  original_invoice_no text,
  reason text not null,
  taxable_value numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'Issued',
  remarks text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, credit_note_no)
);

create table if not exists public.credit_note_items (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.credit_notes(id) on delete cascade,
  line_no integer not null default 1,
  item_id uuid,
  item_name text not null,
  description text,
  hsn_sac text,
  unit text,
  qty numeric(14,3) not null default 1,
  rate numeric(14,2) not null default 0,
  gst_rate numeric(6,2) not null default 0,
  amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sales_orders_company_date_idx on public.sales_orders(company_id, order_date desc);
create index if not exists sales_order_items_order_idx on public.sales_order_items(order_id, line_no);
create index if not exists credit_notes_company_date_idx on public.credit_notes(company_id, credit_note_date desc);
create index if not exists credit_note_items_credit_note_idx on public.credit_note_items(credit_note_id, line_no);
create index if not exists quotations_company_date_idx on public.quotations(company_id, invoice_date desc);
