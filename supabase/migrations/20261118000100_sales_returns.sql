create table if not exists public.sales_returns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  return_no text not null,
  return_date date not null default current_date,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  original_invoice_id uuid not null references public.sales_invoices(id),
  original_invoice_no text,
  reason text not null,
  remarks text,
  taxable_value numeric(14,2) not null default 0,
  cgst numeric(14,2) not null default 0,
  sgst numeric(14,2) not null default 0,
  igst numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  adjustment_type text not null default 'credit_note'
    check (adjustment_type in ('credit_note','account_only','inventory_only')),
  status text not null default 'Recorded',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, return_no)
);

create table if not exists public.sales_return_items (
  id uuid primary key default gen_random_uuid(),
  sales_return_id uuid not null references public.sales_returns(id) on delete cascade,
  original_invoice_id uuid not null references public.sales_invoices(id),
  original_invoice_item_id uuid references public.sales_invoice_items(id),
  line_no integer not null default 1,
  item_id uuid references public.items(id),
  item_name text not null,
  hsn_sac text,
  unit text,
  original_qty numeric(14,3) not null default 0,
  previously_returned_qty numeric(14,3) not null default 0,
  qty numeric(14,3) not null default 0,
  accepted_qty numeric(14,3) not null default 0,
  rejected_qty numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0,
  gst_rate numeric(6,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  reason text,
  disposition text not null default 'usable'
    check (disposition in ('usable','inspection','damaged')),
  created_at timestamptz not null default now()
);

create index if not exists sales_returns_company_date_idx
  on public.sales_returns(company_id, return_date desc);
create index if not exists sales_return_items_parent_idx
  on public.sales_return_items(sales_return_id, line_no);
create index if not exists sales_return_items_invoice_idx
  on public.sales_return_items(original_invoice_id);

alter table public.sales_returns enable row level security;
drop policy if exists sales_returns_company_owner_access on public.sales_returns;
create policy sales_returns_company_owner_access on public.sales_returns
  for all to authenticated
  using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));
drop policy if exists sales_returns_ca_assigned_read on public.sales_returns;
create policy sales_returns_ca_assigned_read on public.sales_returns
  for select to authenticated
  using (private.has_ca_company_access(company_id,false));
drop policy if exists sales_returns_ca_assigned_write on public.sales_returns;
create policy sales_returns_ca_assigned_write on public.sales_returns
  for all to authenticated
  using (private.has_ca_company_access(company_id,true))
  with check (private.has_ca_company_access(company_id,true));
drop policy if exists sales_returns_assigned_user_read on public.sales_returns;
create policy sales_returns_assigned_user_read on public.sales_returns
  for select to authenticated
  using (private.has_company_user_permission(company_id,'sales',false));
drop policy if exists sales_returns_assigned_user_write on public.sales_returns;
create policy sales_returns_assigned_user_write on public.sales_returns
  for all to authenticated
  using (private.has_company_user_permission(company_id,'sales',true))
  with check (private.has_company_user_permission(company_id,'sales',true));

alter table public.sales_return_items enable row level security;
drop policy if exists sales_return_items_company_access on public.sales_return_items;
create policy sales_return_items_company_access on public.sales_return_items
  for all to authenticated
  using (exists (select 1 from public.sales_returns r where r.id=sales_return_items.sales_return_id and private.is_company_owner(r.company_id)))
  with check (exists (select 1 from public.sales_returns r where r.id=sales_return_items.sales_return_id and private.is_company_owner(r.company_id)));
drop policy if exists sales_return_items_ca_access on public.sales_return_items;
create policy sales_return_items_ca_access on public.sales_return_items
  for all to authenticated
  using (exists (select 1 from public.sales_returns r where r.id=sales_return_items.sales_return_id and private.has_ca_company_access(r.company_id,true)))
  with check (exists (select 1 from public.sales_returns r where r.id=sales_return_items.sales_return_id and private.has_ca_company_access(r.company_id,true)));
drop policy if exists sales_return_items_assigned_user_access on public.sales_return_items;
create policy sales_return_items_assigned_user_access on public.sales_return_items
  for all to authenticated
  using (exists (select 1 from public.sales_returns r where r.id=sales_return_items.sales_return_id and private.has_company_user_permission(r.company_id,'sales',true)))
  with check (exists (select 1 from public.sales_returns r where r.id=sales_return_items.sales_return_id and private.has_company_user_permission(r.company_id,'sales',true)));
