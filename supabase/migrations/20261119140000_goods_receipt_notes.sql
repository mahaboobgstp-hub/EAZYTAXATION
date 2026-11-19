create table if not exists public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  receipt_no text not null,
  receipt_date date not null default current_date,
  receipt_type text not null default 'direct' check (receipt_type in ('purchase_order','direct')),
  vendor_id uuid not null references public.vendors(id),
  vendor_name text not null,
  purchase_order_id uuid references public.purchase_orders(id),
  purchase_order_no text,
  supplier_challan_no text,
  received_by text,
  remarks text,
  total_received_qty numeric(14,3) not null default 0,
  accepted_qty numeric(14,3) not null default 0,
  damaged_qty numeric(14,3) not null default 0,
  status text not null default 'Received',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, receipt_no)
);
create table if not exists public.goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  goods_receipt_id uuid not null references public.goods_receipts(id) on delete cascade,
  line_no integer not null default 1,
  item_id uuid references public.items(id),
  item_name text not null,
  hsn_sac text,
  unit text,
  ordered_qty numeric(14,3) not null default 0,
  received_qty numeric(14,3) not null default 0,
  accepted_qty numeric(14,3) not null default 0,
  damaged_qty numeric(14,3) not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  check (received_qty >= 0 and accepted_qty >= 0 and damaged_qty >= 0),
  check (accepted_qty + damaged_qty = received_qty)
);
create index if not exists goods_receipts_company_date_idx on public.goods_receipts(company_id, receipt_date desc);
create index if not exists goods_receipt_items_parent_idx on public.goods_receipt_items(goods_receipt_id, line_no);
create index if not exists goods_receipts_vendor_idx on public.goods_receipts(company_id, vendor_id);
alter table public.goods_receipts enable row level security;
create policy goods_receipts_company_owner_access on public.goods_receipts for all to authenticated using (private.is_company_owner(company_id)) with check (private.is_company_owner(company_id));
create policy goods_receipts_ca_assigned_read on public.goods_receipts for select to authenticated using (private.has_ca_company_access(company_id,false));
create policy goods_receipts_ca_assigned_write on public.goods_receipts for all to authenticated using (private.has_ca_company_access(company_id,true)) with check (private.has_ca_company_access(company_id,true));
create policy goods_receipts_assigned_user_read on public.goods_receipts for select to authenticated using (private.has_company_user_permission(company_id,'purchase',false));
create policy goods_receipts_assigned_user_write on public.goods_receipts for all to authenticated using (private.has_company_user_permission(company_id,'purchase',true)) with check (private.has_company_user_permission(company_id,'purchase',true));
alter table public.goods_receipt_items enable row level security;
create policy goods_receipt_items_company_access on public.goods_receipt_items for all to authenticated using (exists (select 1 from public.goods_receipts r where r.id=goods_receipt_items.goods_receipt_id and private.is_company_owner(r.company_id))) with check (exists (select 1 from public.goods_receipts r where r.id=goods_receipt_items.goods_receipt_id and private.is_company_owner(r.company_id)));
create policy goods_receipt_items_ca_access on public.goods_receipt_items for all to authenticated using (exists (select 1 from public.goods_receipts r where r.id=goods_receipt_items.goods_receipt_id and private.has_ca_company_access(r.company_id,true))) with check (exists (select 1 from public.goods_receipts r where r.id=goods_receipt_items.goods_receipt_id and private.has_ca_company_access(r.company_id,true)));
create policy goods_receipt_items_assigned_user_access on public.goods_receipt_items for all to authenticated using (exists (select 1 from public.goods_receipts r where r.id=goods_receipt_items.goods_receipt_id and private.has_company_user_permission(r.company_id,'purchase',true))) with check (exists (select 1 from public.goods_receipts r where r.id=goods_receipt_items.goods_receipt_id and private.has_company_user_permission(r.company_id,'purchase',true)));
grant select, insert, update, delete on public.goods_receipts, public.goods_receipt_items to authenticated;
