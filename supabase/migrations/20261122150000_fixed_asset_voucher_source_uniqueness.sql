-- Enforce one fixed-asset voucher per source record at database level.
-- Separate payment records/depreciation entries/disposal records use their own IDs.
CREATE UNIQUE INDEX IF NOT EXISTS accounting_vouchers_fixed_assets_source_unique
ON public.accounting_vouchers (company_id, source_module, source_record_id)
WHERE source_module = 'fixed_assets' AND source_record_id IS NOT NULL;
