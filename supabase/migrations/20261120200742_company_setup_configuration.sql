alter table public.companies
  add column if not exists trade_name text,
  add column if not exists business_activity text,
  add column if not exists inventory_enabled boolean not null default false,
  add column if not exists chart_of_accounts_enabled boolean not null default false,
  add column if not exists manufacturing_enabled boolean not null default false,
  add column if not exists accounting_basis text not null default 'Accrual',
  add column if not exists module_settings jsonb not null default
    '{"sales":true,"purchases":true,"expenses":true,"banking":true,"gst_tax":false,"accounting":false,"inventory":false,"hr":false,"payroll":false,"manufacturing":false,"multi_location":false}'::jsonb,
  add column if not exists accounting_settings jsonb not null default
    '{"cost_centres":false,"department_tracking":false,"bank_reconciliation":true,"opening_balances_pending":true}'::jsonb,
  add column if not exists inventory_settings jsonb not null default
    '{"valuation_method":"Weighted Average","warehouses":false,"batch_tracking":false,"serial_tracking":false,"allow_negative_stock":false,"opening_stock_pending":true}'::jsonb,
  add column if not exists tax_settings jsonb not null default
    '{"gst_enabled":false,"e_invoice_enabled":false,"e_way_bill_enabled":false,"tds_enabled":false,"tcs_enabled":false,"professional_tax_enabled":false}'::jsonb,
  add column if not exists company_setup_completed boolean not null default false,
  add column if not exists company_setup_version integer not null default 1;

alter table public.companies
  drop constraint if exists companies_accounting_basis_check;
alter table public.companies
  add constraint companies_accounting_basis_check
  check (accounting_basis in ('Accrual','Cash'));

alter table public.companies
  drop constraint if exists companies_chart_of_accounts_requires_accounting_check;
alter table public.companies
  add constraint companies_chart_of_accounts_requires_accounting_check
  check (chart_of_accounts_enabled = false or accounting_enabled = true);

alter table public.companies
  drop constraint if exists companies_module_settings_object_check;
alter table public.companies
  add constraint companies_module_settings_object_check
  check (jsonb_typeof(module_settings) = 'object');

alter table public.companies
  drop constraint if exists companies_accounting_settings_object_check;
alter table public.companies
  add constraint companies_accounting_settings_object_check
  check (jsonb_typeof(accounting_settings) = 'object');

alter table public.companies
  drop constraint if exists companies_inventory_settings_object_check;
alter table public.companies
  add constraint companies_inventory_settings_object_check
  check (jsonb_typeof(inventory_settings) = 'object');

alter table public.companies
  drop constraint if exists companies_tax_settings_object_check;
alter table public.companies
  add constraint companies_tax_settings_object_check
  check (jsonb_typeof(tax_settings) = 'object');

update public.companies
set module_settings =
  coalesce(module_settings, '{}'::jsonb) ||
  jsonb_build_object(
    'accounting', accounting_enabled,
    'gst_tax', gst_registered,
    'inventory', inventory_enabled,
    'manufacturing', manufacturing_enabled,
    'multi_location', multi_location_enabled
  ),
    tax_settings =
  coalesce(tax_settings, '{}'::jsonb) ||
  jsonb_build_object('gst_enabled', gst_registered)
where true;
