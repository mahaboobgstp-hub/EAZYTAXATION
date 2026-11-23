alter table public.chart_of_accounts
  add column if not exists parent_ledger_id uuid,
  add column if not exists ledger_level text not null default 'Main Ledger',
  add column if not exists is_posting_enabled boolean not null default true;

alter table public.chart_of_accounts
  drop constraint if exists chart_of_accounts_ledger_level_check;
alter table public.chart_of_accounts
  add constraint chart_of_accounts_ledger_level_check
  check (ledger_level in ('Main Ledger','Intermediate Ledger','Subledger'));

alter table public.chart_of_accounts
  drop constraint if exists chart_of_accounts_parent_company_fk;
alter table public.chart_of_accounts
  add constraint chart_of_accounts_parent_company_fk
  foreign key (company_id, parent_ledger_id)
  references public.chart_of_accounts(company_id, id)
  on delete restrict;

create index if not exists chart_of_accounts_company_parent_ledger_idx
  on public.chart_of_accounts(company_id, parent_ledger_id);

create index if not exists chart_of_accounts_company_level_idx
  on public.chart_of_accounts(company_id, ledger_level);

comment on column public.chart_of_accounts.parent_ledger_id is 'Optional parent ledger for hierarchical ledger roll-up.';
comment on column public.chart_of_accounts.ledger_level is 'Main Ledger, Intermediate Ledger, or Subledger.';
comment on column public.chart_of_accounts.is_posting_enabled is 'Controls whether voucher lines may post directly to this ledger.';