create table if not exists public.voice_transaction_sessions (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    transaction_type text not null check (transaction_type in ('sales_invoice','purchase_invoice','expense','customer_master','vendor_master','item_master','navigation','general')),
    title text,
    draft_data jsonb not null default '{}'::jsonb,
    conversation_context jsonb not null default '{}'::jsonb,
    change_history jsonb not null default '[]'::jsonb,
    status text not null default 'in_progress' check (status in ('in_progress','paused','ready_for_review','completed','cancelled')),
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);

create index if not exists voice_sessions_company_user_status_idx
    on public.voice_transaction_sessions (company_id, user_id, status, updated_at desc);

alter table public.voice_transaction_sessions enable row level security;

grant select, insert, update, delete on public.voice_transaction_sessions to authenticated;

drop policy if exists "Users can view their own company voice sessions" on public.voice_transaction_sessions;
create policy "Users can view their own company voice sessions"
on public.voice_transaction_sessions
for select to authenticated
using (
    user_id = (select auth.uid())
    and exists (
        select 1 from public.companies c
        where c.id = voice_transaction_sessions.company_id
          and (
              c.owner_user_id = (select auth.uid())
              or exists (
                  select 1 from public.company_user_access cua
                  where cua.company_id = c.id
                    and cua.user_id = (select auth.uid())
                    and cua.status = 'Active'
              )
              or exists (
                  select 1 from public.ca_company_assignments cca
                  where cca.company_id = c.id
                    and cca.ca_user_id = (select auth.uid())
                    and cca.status = 'Active'
              )
          )
    )
);

drop policy if exists "Users can create their own company voice sessions" on public.voice_transaction_sessions;
create policy "Users can create their own company voice sessions"
on public.voice_transaction_sessions
for insert to authenticated
with check (
    user_id = (select auth.uid())
    and exists (
        select 1 from public.companies c
        where c.id = voice_transaction_sessions.company_id
          and (
              c.owner_user_id = (select auth.uid())
              or exists (
                  select 1 from public.company_user_access cua
                  where cua.company_id = c.id
                    and cua.user_id = (select auth.uid())
                    and cua.status = 'Active'
              )
              or exists (
                  select 1 from public.ca_company_assignments cca
                  where cca.company_id = c.id
                    and cca.ca_user_id = (select auth.uid())
                    and cca.status = 'Active'
              )
          )
    )
);

drop policy if exists "Users can update their own company voice sessions" on public.voice_transaction_sessions;
create policy "Users can update their own company voice sessions"
on public.voice_transaction_sessions
for update to authenticated
using (user_id = (select auth.uid()))
with check (
    user_id = (select auth.uid())
    and exists (
        select 1 from public.companies c
        where c.id = voice_transaction_sessions.company_id
          and (
              c.owner_user_id = (select auth.uid())
              or exists (
                  select 1 from public.company_user_access cua
                  where cua.company_id = c.id
                    and cua.user_id = (select auth.uid())
                    and cua.status = 'Active'
              )
              or exists (
                  select 1 from public.ca_company_assignments cca
                  where cca.company_id = c.id
                    and cca.ca_user_id = (select auth.uid())
                    and cca.status = 'Active'
              )
          )
    )
);

drop policy if exists "Users can delete their own company voice sessions" on public.voice_transaction_sessions;
create policy "Users can delete their own company voice sessions"
on public.voice_transaction_sessions
for delete to authenticated
using (user_id = (select auth.uid()));
