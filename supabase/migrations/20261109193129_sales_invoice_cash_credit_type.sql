alter table public.sales_invoices add column if not exists sale_type text not null default 'CASH';
