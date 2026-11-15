alter table public.companies
  add column if not exists constitution_type text,
  add column if not exists industry text,
  add column if not exists gst_registered boolean not null default false,
  add column if not exists gst_registration_type text,
  add column if not exists accounting_enabled boolean not null default false,
  add column if not exists financial_year_start_month integer not null default 4,
  add column if not exists books_beginning_date date,
  add column if not exists currency_code text not null default 'INR',
  add column if not exists multi_location_enabled boolean not null default false;

alter table public.companies
  drop constraint if exists companies_financial_year_start_month_check;
alter table public.companies
  add constraint companies_financial_year_start_month_check
  check (financial_year_start_month between 1 and 12);

alter table public.companies
  drop constraint if exists companies_gst_registration_type_check;
alter table public.companies
  add constraint companies_gst_registration_type_check
  check (gst_registration_type is null or gst_registration_type in ('Regular','Composition','Other'));

update public.companies
set gst_registered = (coalesce(nullif(trim(gstin), ''), '') <> '')
where gst_registered = false and coalesce(nullif(trim(gstin), ''), '') <> '';

update public.companies
set accounting_enabled = false
where accounting_enabled is null;
