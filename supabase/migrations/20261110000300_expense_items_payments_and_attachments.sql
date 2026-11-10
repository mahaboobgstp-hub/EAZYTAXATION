alter table public.expenses
  add column if not exists payee_name text,
  add column if not exists payment_account text,
  add column if not exists paid_by text,
  add column if not exists due_date date,
  add column if not exists paid_amount numeric(14,2) not null default 0,
  add column if not exists discount_amount numeric(14,2) not null default 0,
  add column if not exists other_charges numeric(14,2) not null default 0,
  add column if not exists round_off numeric(14,2) not null default 0,
  add column if not exists gst_treatment text not null default 'Registered (Regular)';

create table if not exists public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  line_no integer not null,
  description text not null,
  hsn_sac text,
  qty numeric(14,3) not null default 1,
  uom text,
  rate numeric(14,2) not null default 0,
  discount_percent numeric(7,3) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0,
  gst_percent numeric(7,3) not null default 0,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(expense_id, line_no)
);

create table if not exists public.expense_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  expense_id uuid references public.expenses(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  payment_no text not null,
  payment_date date not null default current_date,
  paid_to text not null,
  payment_method text not null default 'Bank',
  account_name text,
  reference_no text,
  amount numeric(14,2) not null default 0,
  status text not null default 'Completed',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, payment_no)
);

create index if not exists expense_items_expense_line_idx on public.expense_items(expense_id,line_no);
create index if not exists expense_payments_company_date_idx on public.expense_payments(company_id,payment_date desc);
create index if not exists expense_payments_expense_idx on public.expense_payments(expense_id);

alter table public.expense_items enable row level security;
alter table public.expense_payments enable row level security;

drop policy if exists expense_items_owner_access on public.expense_items;
create policy expense_items_owner_access on public.expense_items
  for all to authenticated
  using (exists (
    select 1 from public.expenses e
    join public.companies c on c.id=e.company_id
    where e.id=expense_items.expense_id and c.owner_user_id=(select auth.uid())
  ))
  with check (exists (
    select 1 from public.expenses e
    join public.companies c on c.id=e.company_id
    where e.id=expense_items.expense_id and c.owner_user_id=(select auth.uid())
  ));

drop policy if exists expense_payments_owner_access on public.expense_payments;
create policy expense_payments_owner_access on public.expense_payments
  for all to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id=expense_payments.company_id and c.owner_user_id=(select auth.uid())
  ))
  with check (exists (
    select 1 from public.companies c
    where c.id=expense_payments.company_id and c.owner_user_id=(select auth.uid())
  ));

grant select,insert,update,delete on public.expense_items, public.expense_payments to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('expense-attachments','expense-attachments',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists expense_attachments_owner_select on storage.objects;
create policy expense_attachments_owner_select on storage.objects
  for select to authenticated using (
    bucket_id='expense-attachments'
    and exists(select 1 from public.companies c where c.id=(storage.foldername(name))[1]::uuid and c.owner_user_id=(select auth.uid()))
  );
drop policy if exists expense_attachments_owner_insert on storage.objects;
create policy expense_attachments_owner_insert on storage.objects
  for insert to authenticated with check (
    bucket_id='expense-attachments'
    and exists(select 1 from public.companies c where c.id=(storage.foldername(name))[1]::uuid and c.owner_user_id=(select auth.uid()))
  );
drop policy if exists expense_attachments_owner_update on storage.objects;
create policy expense_attachments_owner_update on storage.objects
  for update to authenticated using (
    bucket_id='expense-attachments'
    and exists(select 1 from public.companies c where c.id=(storage.foldername(name))[1]::uuid and c.owner_user_id=(select auth.uid()))
  ) with check (
    bucket_id='expense-attachments'
    and exists(select 1 from public.companies c where c.id=(storage.foldername(name))[1]::uuid and c.owner_user_id=(select auth.uid()))
  );