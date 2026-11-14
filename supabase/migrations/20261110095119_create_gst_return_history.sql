create table if not exists public.gst_return_history (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 return_type text not null default 'GSTR-1',
 return_period text not null,
 financial_year text not null,
 file_name text not null,
 invoice_count integer not null default 0,
 taxable_value numeric(18,2) not null default 0,
 total_gst numeric(18,2) not null default 0,
 invoice_value numeric(18,2) not null default 0,
 status text not null default 'Generated' check(status in ('Generated','Uploaded')),
 generated_at timestamptz not null default now(),
 uploaded_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.gst_return_history enable row level security;
create policy "Company owners manage GST return history" on public.gst_return_history for all to authenticated
using(exists(select 1 from public.companies c where c.id=gst_return_history.company_id and c.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.companies c where c.id=gst_return_history.company_id and c.owner_user_id=(select auth.uid())));
grant select,insert,update,delete on public.gst_return_history to authenticated;
create index if not exists gst_return_history_company_generated_idx on public.gst_return_history(company_id,generated_at desc);