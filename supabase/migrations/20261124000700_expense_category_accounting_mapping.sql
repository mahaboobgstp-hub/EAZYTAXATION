alter table public.expense_categories add column if not exists main_group_id uuid;
alter table public.expense_categories add column if not exists intermediate_group_id uuid;
alter table public.expense_categories add constraint expense_categories_main_group_company_fk foreign key (company_id,main_group_id) references public.account_groups(company_id,id) on delete restrict;
alter table public.expense_categories add constraint expense_categories_intermediate_group_company_fk foreign key (company_id,intermediate_group_id) references public.account_groups(company_id,id) on delete restrict;
create index if not exists expense_categories_company_ledger_idx on public.expense_categories(company_id,ledger_id);
comment on column public.expense_categories.ledger_id is 'Expense posting ledger selected for this category; used by automatic accounting only when Accounting is enabled.';