alter table public.invoice_settings add column if not exists updated_at timestamptz not null default now();
