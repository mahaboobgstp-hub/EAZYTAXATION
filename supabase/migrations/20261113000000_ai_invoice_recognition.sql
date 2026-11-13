-- AI invoice recognition foundation for Android purchase and expense capture.
-- All extracted values remain drafts; this feature never creates purchase or expense transactions.

create table if not exists public.ai_invoice_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  transaction_type text not null check (transaction_type in ('purchase','expense')),
  source_bucket text not null default 'ai-invoice-documents',
  source_path text not null,
  source_file_name text not null,
  source_mime_type text not null check (source_mime_type in ('application/pdf','image/jpeg','image/png')),
  source_file_size bigint not null check (source_file_size > 0 and source_file_size <= 10485760),
  status text not null default 'queued' check (status in ('queued','processing','needs_review','failed')),
  extracted_data jsonb,
  validation_results jsonb not null default '{}'::jsonb,
  model_name text,
  processing_attempts integer not null default 0,
  error_message text,
  processing_started_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_invoice_processing_jobs_source_path_key unique (source_bucket, source_path)
);

create index if not exists ai_invoice_jobs_company_created_idx
  on public.ai_invoice_processing_jobs(company_id, created_at desc);
create index if not exists ai_invoice_jobs_company_status_idx
  on public.ai_invoice_processing_jobs(company_id, status);

alter table public.ai_invoice_processing_jobs enable row level security;

drop policy if exists ai_invoice_jobs_read on public.ai_invoice_processing_jobs;
create policy ai_invoice_jobs_read
on public.ai_invoice_processing_jobs
for select to authenticated
using (
  case when transaction_type = 'purchase' then
    private.is_company_owner(company_id)
    or private.has_ca_company_access(company_id, false)
    or private.has_company_user_permission(company_id, 'purchase', false)
  else
    private.is_company_owner(company_id)
    or private.has_ca_company_access(company_id, false)
    or private.has_company_user_permission(company_id, 'expenses', false)
  end
);

drop policy if exists ai_invoice_jobs_insert on public.ai_invoice_processing_jobs;
create policy ai_invoice_jobs_insert
on public.ai_invoice_processing_jobs
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    case when transaction_type = 'purchase' then
      private.is_company_owner(company_id)
      or private.has_ca_company_access(company_id, true)
      or private.has_company_user_permission(company_id, 'purchase', true)
    else
      private.is_company_owner(company_id)
      or private.has_ca_company_access(company_id, true)
      or private.has_company_user_permission(company_id, 'expenses', true)
    end
  )
);

drop policy if exists ai_invoice_jobs_update on public.ai_invoice_processing_jobs;
create policy ai_invoice_jobs_update
on public.ai_invoice_processing_jobs
for update to authenticated
using (
  case when transaction_type = 'purchase' then
    private.is_company_owner(company_id)
    or private.has_ca_company_access(company_id, true)
    or private.has_company_user_permission(company_id, 'purchase', true)
  else
    private.is_company_owner(company_id)
    or private.has_ca_company_access(company_id, true)
    or private.has_company_user_permission(company_id, 'expenses', true)
  end
)
with check (
  case when transaction_type = 'purchase' then
    private.is_company_owner(company_id)
    or private.has_ca_company_access(company_id, true)
    or private.has_company_user_permission(company_id, 'purchase', true)
  else
    private.is_company_owner(company_id)
    or private.has_ca_company_access(company_id, true)
    or private.has_company_user_permission(company_id, 'expenses', true)
  end
);

grant select, insert, update on public.ai_invoice_processing_jobs to authenticated;
revoke all on public.ai_invoice_processing_jobs from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-invoice-documents',
  'ai-invoice-documents',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png'];

drop policy if exists ai_invoice_documents_read on storage.objects;
create policy ai_invoice_documents_read
on storage.objects
for select to authenticated
using (
  bucket_id = 'ai-invoice-documents'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then
      case when split_part(name, '/', 2) = 'purchase' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, false)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'purchase', false)
      when split_part(name, '/', 2) = 'expense' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, false)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'expenses', false)
      else false end
    else false
  end
);

drop policy if exists ai_invoice_documents_insert on storage.objects;
create policy ai_invoice_documents_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'ai-invoice-documents'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then
      case when split_part(name, '/', 2) = 'purchase' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'purchase', true)
      when split_part(name, '/', 2) = 'expense' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'expenses', true)
      else false end
    else false
  end
);

drop policy if exists ai_invoice_documents_update on storage.objects;
create policy ai_invoice_documents_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'ai-invoice-documents'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then
      case when split_part(name, '/', 2) = 'purchase' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'purchase', true)
      when split_part(name, '/', 2) = 'expense' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'expenses', true)
      else false end
    else false
  end
)
with check (
  bucket_id = 'ai-invoice-documents'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then
      case when split_part(name, '/', 2) = 'purchase' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'purchase', true)
      when split_part(name, '/', 2) = 'expense' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'expenses', true)
      else false end
    else false
  end
);

drop policy if exists ai_invoice_documents_delete on storage.objects;
create policy ai_invoice_documents_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'ai-invoice-documents'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then
      case when split_part(name, '/', 2) = 'purchase' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'purchase', true)
      when split_part(name, '/', 2) = 'expense' then
        private.is_company_owner(split_part(name, '/', 1)::uuid)
        or private.has_ca_company_access(split_part(name, '/', 1)::uuid, true)
        or private.has_company_user_permission(split_part(name, '/', 1)::uuid, 'expenses', true)
      else false end
    else false
  end
);
