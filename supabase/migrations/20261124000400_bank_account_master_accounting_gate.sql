alter table public.bank_account_profiles alter column ledger_id drop not null;
alter table public.bank_account_profiles add column if not exists account_number_hash text;
create unique index if not exists bank_account_profiles_company_account_hash_ifsc_unique
on public.bank_account_profiles(company_id, account_number_hash, ifsc)
where account_number_hash is not null and is_active=true;
comment on column public.bank_account_profiles.account_number_hash is 'SHA-256 hash of normalized bank account number for duplicate detection; raw account number is not stored.';