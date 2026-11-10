-- EAZYTAXATION accounting foundation
-- Company-scoped double-entry accounting. Apply through Supabase migrations.

create table if not exists public.account_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  group_name text not null,
  group_code text not null,
  parent_group_id uuid,
  account_nature text not null check (account_nature in ('Asset','Liability','Equity','Income','Expense')),
  normal_balance text not null check (normal_balance in ('Debit','Credit')),
  statement_classification text not null check (statement_classification in ('Balance Sheet','Profit & Loss')),
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, group_code),
  unique(company_id, id),
  constraint account_groups_parent_company_fk
    foreign key(company_id, parent_group_id) references public.account_groups(company_id, id) on delete restrict
);

create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ledger_name text not null,
  ledger_code text not null,
  group_id uuid not null,
  opening_balance numeric(18,2) not null default 0 check (opening_balance >= 0),
  opening_balance_type text not null default 'Debit' check (opening_balance_type in ('Debit','Credit')),
  opening_date date,
  party_type text check (party_type in ('Customer','Supplier','Bank','Employee','Other')),
  linked_party_id uuid,
  gst_applicable boolean not null default false,
  gstin text,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chart_of_accounts_group_company_fk
    foreign key(company_id, group_id) references public.account_groups(company_id, id) on delete restrict,
  unique(company_id, ledger_code),
  unique(company_id, id)
);

create table if not exists public.accounting_vouchers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  voucher_number text not null,
  voucher_type text not null default 'Journal' check (voucher_type in ('Journal','Receipt','Payment','Contra','Purchase','Sales','Debit Note','Credit Note','Opening')),
  voucher_date date not null,
  reference_number text,
  narration text,
  source_module text not null default 'Manual',
  source_record_id uuid,
  status text not null default 'Draft' check (status in ('Draft','Posted','Reversed')),
  total_debit numeric(18,2) not null default 0,
  total_credit numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  posted_by uuid references auth.users(id),
  posted_at timestamptz,
  reversed_voucher_id uuid references public.accounting_vouchers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, voucher_number),
  unique(company_id, id)
);

create unique index if not exists accounting_vouchers_source_unique
  on public.accounting_vouchers(company_id, source_module, source_record_id)
  where source_record_id is not null and status <> 'Reversed';

create table if not exists public.accounting_voucher_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  voucher_id uuid not null,
  ledger_id uuid not null,
  line_number integer not null,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  line_narration text,
  cost_centre text,
  created_at timestamptz not null default now(),
  constraint accounting_lines_one_side_only check (
    (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
  ),
  constraint accounting_lines_voucher_company_fk
    foreign key(company_id, voucher_id) references public.accounting_vouchers(company_id, id) on delete cascade,
  constraint accounting_lines_ledger_company_fk
    foreign key(company_id, ledger_id) references public.chart_of_accounts(company_id, id) on delete restrict,
  unique(voucher_id, line_number)
);

create index if not exists account_groups_company_parent_idx on public.account_groups(company_id, parent_group_id);
create index if not exists chart_of_accounts_company_group_idx on public.chart_of_accounts(company_id, group_id);
create index if not exists accounting_vouchers_company_date_idx on public.accounting_vouchers(company_id, voucher_date, status);
create index if not exists accounting_lines_company_ledger_idx on public.accounting_voucher_lines(company_id, ledger_id);

alter table public.account_groups enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.accounting_vouchers enable row level security;
alter table public.accounting_voucher_lines enable row level security;

drop policy if exists "Company users manage account groups" on public.account_groups;
create policy "Company users manage account groups" on public.account_groups
for all using (exists (select 1 from public.companies c where c.id = account_groups.company_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.companies c where c.id = account_groups.company_id and c.owner_user_id = auth.uid()));

drop policy if exists "Company users manage chart of accounts" on public.chart_of_accounts;
create policy "Company users manage chart of accounts" on public.chart_of_accounts
for all using (exists (select 1 from public.companies c where c.id = chart_of_accounts.company_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.companies c where c.id = chart_of_accounts.company_id and c.owner_user_id = auth.uid()));

drop policy if exists "Company users manage accounting vouchers" on public.accounting_vouchers;
create policy "Company users manage accounting vouchers" on public.accounting_vouchers
for all using (exists (select 1 from public.companies c where c.id = accounting_vouchers.company_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.companies c where c.id = accounting_vouchers.company_id and c.owner_user_id = auth.uid()));

drop policy if exists "Company users manage accounting voucher lines" on public.accounting_voucher_lines;
create policy "Company users manage accounting voucher lines" on public.accounting_voucher_lines
for all using (exists (select 1 from public.companies c where c.id = accounting_voucher_lines.company_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.companies c where c.id = accounting_voucher_lines.company_id and c.owner_user_id = auth.uid()));

-- Posting is atomic: the voucher can only move from Draft to Posted when it
-- contains at least two valid lines and total debits equal total credits.
create or replace function public.post_accounting_voucher(p_company_id uuid, p_voucher_id uuid)
returns public.accounting_vouchers
language plpgsql
security invoker
set search_path = public
as $$
declare
  v public.accounting_vouchers;
  v_debit numeric(18,2);
  v_credit numeric(18,2);
  v_count integer;
begin
  select * into v
  from public.accounting_vouchers
  where id = p_voucher_id and company_id = p_company_id
  for update;

  if not found then
    raise exception 'Voucher not found for the selected company';
  end if;

  if v.status <> 'Draft' then
    raise exception 'Only draft vouchers can be posted';
  end if;

  select coalesce(sum(debit),0), coalesce(sum(credit),0), count(*)
  into v_debit, v_credit, v_count
  from public.accounting_voucher_lines
  where voucher_id = p_voucher_id and company_id = p_company_id;

  if v_count < 2 then
    raise exception 'A voucher must contain at least two lines';
  end if;

  if v_debit <= 0 or v_debit <> v_credit then
    raise exception 'Voucher is not balanced. Debit: %, Credit: %', v_debit, v_credit;
  end if;

  update public.accounting_vouchers
  set status = 'Posted',
      total_debit = v_debit,
      total_credit = v_credit,
      posted_by = auth.uid(),
      posted_at = now(),
      updated_at = now()
  where id = p_voucher_id and company_id = p_company_id
  returning * into v;

  return v;
end;
$$;


-- Authenticated company owners need table privileges; RLS remains the
-- authoritative company-isolation boundary.
grant select, insert, update, delete on public.account_groups to authenticated;
grant select, insert, update, delete on public.chart_of_accounts to authenticated;
grant select, insert, update, delete on public.accounting_vouchers to authenticated;
grant select, insert, update, delete on public.accounting_voucher_lines to authenticated;

-- Posted financial history is immutable. Corrections must use a separate
-- reversal workflow rather than editing or deleting historical journal lines.
create or replace function public.prevent_posted_accounting_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $
declare
  v_status text;
begin
  if tg_table_name = 'accounting_vouchers' then
    if old.status in ('Posted','Reversed') then
      raise exception 'Posted accounting vouchers are immutable. Create a reversal voucher instead.';
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    select status into v_status
    from public.accounting_vouchers
    where id = new.voucher_id and company_id = new.company_id;
  else
    select status into v_status
    from public.accounting_vouchers
    where id = old.voucher_id and company_id = old.company_id;
  end if;

  if v_status is distinct from 'Draft' then
    raise exception 'Journal lines can only be changed while the voucher is Draft.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$;

drop trigger if exists protect_posted_accounting_vouchers on public.accounting_vouchers;
create trigger protect_posted_accounting_vouchers
before update or delete on public.accounting_vouchers
for each row execute function public.prevent_posted_accounting_mutation();

drop trigger if exists protect_accounting_voucher_lines on public.accounting_voucher_lines;
create trigger protect_accounting_voucher_lines
before insert or update or delete on public.accounting_voucher_lines
for each row execute function public.prevent_posted_accounting_mutation();

grant execute on function public.post_accounting_voucher(uuid, uuid) to authenticated;
