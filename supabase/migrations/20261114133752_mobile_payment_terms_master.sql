create table if not exists public.payment_terms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  term_name text not null,
  due_days integer not null default 0 check (due_days >= 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, term_name),
  unique(company_id, id)
);
alter table public.payment_terms enable row level security;
create policy "Company owners manage payment terms" on public.payment_terms for all to authenticated
using (exists (select 1 from public.companies c where c.id=payment_terms.company_id and c.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.companies c where c.id=payment_terms.company_id and c.owner_user_id=(select auth.uid())));
grant select,insert,update,delete on public.payment_terms to authenticated;
create index if not exists payment_terms_company_active_idx on public.payment_terms(company_id,is_active);