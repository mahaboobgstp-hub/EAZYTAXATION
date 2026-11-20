alter table public.expense_categories
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists expenditure_type text,
  add column if not exists group_id uuid,
  add column if not exists subgroup_id uuid,
  add column if not exists ledger_id uuid,
  add column if not exists description text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.expense_categories
  add constraint expense_categories_expenditure_type_check
  check (expenditure_type is null or expenditure_type in (
    'capital_expenditure',
    'manufacturing_direct',
    'manufacturing_indirect',
    'operating_expense'
  ));

alter table public.expense_categories
  add constraint expense_categories_group_company_fk
  foreign key (company_id, group_id)
  references public.account_groups(company_id, id) on delete restrict;

alter table public.expense_categories
  add constraint expense_categories_subgroup_company_fk
  foreign key (company_id, subgroup_id)
  references public.account_groups(company_id, id) on delete restrict;

alter table public.expense_categories
  add constraint expense_categories_ledger_company_fk
  foreign key (company_id, ledger_id)
  references public.chart_of_accounts(company_id, id) on delete restrict;

create index if not exists expense_categories_company_active_idx
  on public.expense_categories(company_id, is_active, category_name);

create unique index if not exists expense_categories_company_name_unique
  on public.expense_categories(company_id, lower(category_name))
  where company_id is not null;

drop policy if exists "Authenticated users manage shared expense categories" on public.expense_categories;

drop policy if exists expense_categories_company_read on public.expense_categories;
create policy expense_categories_company_read
  on public.expense_categories for select to authenticated
  using (
    company_id is null
    or private.is_company_owner(company_id)
    or private.has_company_user_permission(company_id, 'masters', false)
    or private.has_ca_company_access(company_id, false)
  );

drop policy if exists expense_categories_company_insert on public.expense_categories;
create policy expense_categories_company_insert
  on public.expense_categories for insert to authenticated
  with check (
    company_id is not null
    and (
      private.is_company_owner(company_id)
      or private.has_company_user_permission(company_id, 'masters', true)
      or private.has_ca_company_access(company_id, true)
    )
  );

drop policy if exists expense_categories_company_update on public.expense_categories;
create policy expense_categories_company_update
  on public.expense_categories for update to authenticated
  using (
    company_id is not null
    and (
      private.is_company_owner(company_id)
      or private.has_company_user_permission(company_id, 'masters', true)
      or private.has_ca_company_access(company_id, true)
    )
  )
  with check (
    company_id is not null
    and (
      private.is_company_owner(company_id)
      or private.has_company_user_permission(company_id, 'masters', true)
      or private.has_ca_company_access(company_id, true)
    )
  );

drop policy if exists expense_categories_company_delete on public.expense_categories;
create policy expense_categories_company_delete
  on public.expense_categories for delete to authenticated
  using (
    company_id is not null
    and (
      private.is_company_owner(company_id)
      or private.has_company_user_permission(company_id, 'masters', true)
      or private.has_ca_company_access(company_id, true)
    )
  );
