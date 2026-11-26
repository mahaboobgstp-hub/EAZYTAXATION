-- PeriOne sandbox E-Way Bill generation/cancellation foundation.
-- Release 1 intentionally stores only one E-Way Bill record per sales invoice.
create table if not exists public.sales_eway_bills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id),
  provider text not null default 'perione',
  environment text not null default 'sandbox' check (environment='sandbox'),
  eway_bill_number text,
  status text not null default 'not_generated'
    check (status in ('not_generated','processing','generated','cancellation_pending','cancelled','generation_failed','cancellation_failed','unknown')),
  generated_at timestamptz,
  valid_until timestamptz,
  cancelled_at timestamptz,
  cancellation_reason_code text,
  cancellation_remarks text,
  provider_status text,
  provider_error_code text,
  provider_error_message text,
  last_operation text check (last_operation in ('generate','cancel')),
  last_operation_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, invoice_id)
);
-- Enforce that an e-way bill's invoice belongs to the same company (composite FK).
create unique index if not exists sales_invoices_id_company_id_uq
  on public.sales_invoices(id,company_id);
do $
begin
  if not exists (
    select 1 from pg_constraint
    where conname='sales_eway_bills_invoice_company_fk'
      and conrelid='public.sales_eway_bills'::regclass
  ) then
    alter table public.sales_eway_bills
      add constraint sales_eway_bills_invoice_company_fk
      foreign key (invoice_id,company_id)
      references public.sales_invoices(id,company_id);
  end if;
end $;

create index if not exists sales_eway_bills_company_status_idx
  on public.sales_eway_bills(company_id,status,created_at desc);

create table if not exists public.sales_eway_bill_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  eway_bill_id uuid not null references public.sales_eway_bills(id) on delete cascade,
  event_type text not null check (event_type in ('generate_requested','generate_succeeded','generate_failed','cancel_requested','cancel_succeeded','cancel_failed','reconciliation')),
  environment text not null default 'sandbox' check (environment='sandbox'),
  message text,
  provider_error_code text,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id)
);
create index if not exists sales_eway_bill_events_company_time_idx
  on public.sales_eway_bill_events(company_id,occurred_at desc);

alter table public.sales_eway_bills enable row level security;
alter table public.sales_eway_bill_events enable row level security;

drop policy if exists sales_eway_bills_owner_all on public.sales_eway_bills;
create policy sales_eway_bills_owner_all on public.sales_eway_bills
  for all to authenticated using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));

drop policy if exists sales_eway_bills_ca_read on public.sales_eway_bills;
create policy sales_eway_bills_ca_read on public.sales_eway_bills
  for select to authenticated using (private.has_ca_company_access(company_id,false));

drop policy if exists sales_eway_bills_ca_write on public.sales_eway_bills;
create policy sales_eway_bills_ca_write on public.sales_eway_bills
  for all to authenticated using (private.has_ca_company_access(company_id,true))
  with check (private.has_ca_company_access(company_id,true));

drop policy if exists sales_eway_bills_user_read on public.sales_eway_bills;
create policy sales_eway_bills_user_read on public.sales_eway_bills
  for select to authenticated using (private.has_company_user_permission(company_id,'gst',false));

drop policy if exists sales_eway_bills_user_write on public.sales_eway_bills;
create policy sales_eway_bills_user_write on public.sales_eway_bills
  for all to authenticated using (private.has_company_user_permission(company_id,'gst',true))
  with check (private.has_company_user_permission(company_id,'gst',true));

drop policy if exists sales_eway_bill_events_owner_all on public.sales_eway_bill_events;
create policy sales_eway_bill_events_owner_all on public.sales_eway_bill_events
  for all to authenticated using (private.is_company_owner(company_id))
  with check (private.is_company_owner(company_id));

drop policy if exists sales_eway_bill_events_ca_read on public.sales_eway_bill_events;
create policy sales_eway_bill_events_ca_read on public.sales_eway_bill_events
  for select to authenticated using (private.has_ca_company_access(company_id,false));

drop policy if exists sales_eway_bill_events_ca_write on public.sales_eway_bill_events;
create policy sales_eway_bill_events_ca_write on public.sales_eway_bill_events
  for all to authenticated using (private.has_ca_company_access(company_id,true))
  with check (private.has_ca_company_access(company_id,true));

drop policy if exists sales_eway_bill_events_user_read on public.sales_eway_bill_events;
create policy sales_eway_bill_events_user_read on public.sales_eway_bill_events
  for select to authenticated using (private.has_company_user_permission(company_id,'gst',false));

drop policy if exists sales_eway_bill_events_user_write on public.sales_eway_bill_events;
create policy sales_eway_bill_events_user_write on public.sales_eway_bill_events
  for all to authenticated using (private.has_company_user_permission(company_id,'gst',true))
  with check (private.has_company_user_permission(company_id,'gst',true));

grant select, insert, update on public.sales_eway_bills to authenticated;
grant select, insert on public.sales_eway_bill_events to authenticated;
