alter table public.expenses
  add column if not exists expense_ledger_id uuid,
  add column if not exists payment_ledger_id uuid,
  add column if not exists is_gst_inclusive boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_expense_ledger_company_fk'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_expense_ledger_company_fk
      foreign key (company_id, expense_ledger_id)
      references public.chart_of_accounts(company_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_payment_ledger_company_fk'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_payment_ledger_company_fk
      foreign key (company_id, payment_ledger_id)
      references public.chart_of_accounts(company_id, id)
      on delete restrict;
  end if;
end $$;

create index if not exists expenses_company_expense_ledger_idx
  on public.expenses(company_id, expense_ledger_id);

create index if not exists expenses_company_payment_ledger_idx
  on public.expenses(company_id, payment_ledger_id);
