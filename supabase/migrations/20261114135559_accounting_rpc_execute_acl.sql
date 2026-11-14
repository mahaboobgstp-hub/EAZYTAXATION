revoke all on function public.post_accounting_voucher(uuid,uuid) from public, anon;
grant execute on function public.post_accounting_voucher(uuid,uuid) to authenticated, service_role;