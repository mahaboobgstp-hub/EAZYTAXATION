create index if not exists expense_categories_company_group_idx
  on public.expense_categories(company_id, group_id);
create index if not exists expense_categories_company_subgroup_idx
  on public.expense_categories(company_id, subgroup_id);
create index if not exists expense_categories_company_ledger_idx
  on public.expense_categories(company_id, ledger_id);
create index if not exists expenses_category_id_idx
  on public.expenses(category_id);