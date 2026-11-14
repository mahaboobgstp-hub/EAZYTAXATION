alter table public.purchase_invoices
  add column if not exists payment_status text not null default 'Unpaid',
  add column if not exists paid_amount numeric(14,2) not null default 0;

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  vendor_id uuid references public.vendors(id),
  vendor_name text not null,
  order_no text not null,
  order_date date not null default current_date,
  expected_delivery_date date,
  taxable_value numeric(14,2) not null default 0,
  cgst numeric(14,2) not null default 0,
  sgst numeric(14,2) not null default 0,
  igst numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  ordered_qty numeric(14,3) not null default 0,
  received_qty numeric(14,3) not null default 0,
  status text not null default 'Draft',
  remarks text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, order_no)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  line_no integer not null default 1,
  item_id uuid,
  item_name text not null,
  hsn_sac text,
  uom text,
  qty numeric(14,3) not null default 1,
  rate numeric(14,2) not null default 0,
  taxable_value numeric(14,2) not null default 0,
  gst_rate numeric(6,2) not null default 0,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_returns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  vendor_id uuid references public.vendors(id),
  vendor_name text not null,
  return_no text not null,
  return_date date not null default current_date,
  original_purchase_invoice_id uuid references public.purchase_invoices(id),
  original_purchase_invoice_no text,
  reason text not null,
  taxable_value numeric(14,2) not null default 0,
  cgst numeric(14,2) not null default 0,
  sgst numeric(14,2) not null default 0,
  igst numeric(14,2) not null default 0,
  total_credit numeric(14,2) not null default 0,
  status text not null default 'Draft',
  remarks text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, return_no)
);

create table if not exists public.purchase_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.purchase_returns(id) on delete cascade,
  line_no integer not null default 1,
  item_id uuid,
  item_name text not null,
  hsn_sac text,
  uom text,
  qty numeric(14,3) not null default 1,
  rate numeric(14,2) not null default 0,
  taxable_value numeric(14,2) not null default 0,
  gst_rate numeric(6,2) not null default 0,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.debit_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  vendor_id uuid references public.vendors(id),
  vendor_name text not null,
  debit_note_no text not null,
  debit_note_date date not null default current_date,
  original_purchase_invoice_id uuid references public.purchase_invoices(id),
  original_purchase_invoice_no text,
  reason text not null,
  taxable_value numeric(14,2) not null default 0,
  cgst numeric(14,2) not null default 0,
  sgst numeric(14,2) not null default 0,
  igst numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'Issued',
  remarks text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, debit_note_no)
);

create table if not exists public.debit_note_items (
  id uuid primary key default gen_random_uuid(),
  debit_note_id uuid not null references public.debit_notes(id) on delete cascade,
  line_no integer not null default 1,
  item_id uuid,
  item_name text not null,
  hsn_sac text,
  uom text,
  qty numeric(14,3) not null default 1,
  rate numeric(14,2) not null default 0,
  taxable_value numeric(14,2) not null default 0,
  gst_rate numeric(6,2) not null default 0,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists purchase_orders_company_date_idx on public.purchase_orders(company_id, order_date desc);
create index if not exists purchase_order_items_order_idx on public.purchase_order_items(order_id, line_no);
create index if not exists purchase_returns_company_date_idx on public.purchase_returns(company_id, return_date desc);
create index if not exists purchase_return_items_parent_idx on public.purchase_return_items(return_id, line_no);
create index if not exists debit_notes_company_date_idx on public.debit_notes(company_id, debit_note_date desc);
create index if not exists debit_note_items_parent_idx on public.debit_note_items(debit_note_id, line_no);


alter table public.purchase_invoices add column if not exists gst_treatment text not null default 'Regular Supplier (Registered)';
alter table public.purchase_orders add column if not exists item_count integer not null default 0;
