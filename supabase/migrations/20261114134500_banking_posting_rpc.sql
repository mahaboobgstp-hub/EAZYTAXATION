create or replace function public.post_banking_voucher(
  p_company_id uuid,p_voucher_id uuid,p_allocation_type text default 'none',p_invoice_id uuid default null,p_expense_id uuid default null,
  p_payment_date date default current_date,p_amount numeric default null,p_payment_method text default 'Bank Transfer',
  p_bank_ledger_id uuid default null,p_reference_number text default null,p_account_name text default null,p_remarks text default null
) returns public.accounting_vouchers language plpgsql security invoker set search_path=public as $$
declare v public.accounting_vouchers; v_total numeric(18,2); v_paid numeric(18,2); v_sale_type text; v_vendor_id uuid; v_payee text;
begin
  v:=public.post_accounting_voucher(p_company_id,p_voucher_id);
  if p_allocation_type='none' then return v; end if;
  if p_amount is null or p_amount<=0 then raise exception 'A valid positive allocation amount is required'; end if;
  if abs(p_amount-v.total_debit)>0.005 then raise exception 'Allocation amount must equal the posted voucher total'; end if;
  if not exists(select 1 from public.accounting_voucher_lines l where l.company_id=p_company_id and l.voucher_id=p_voucher_id and l.ledger_id=p_bank_ledger_id and ((p_allocation_type='sales' and l.debit=p_amount) or (p_allocation_type in ('purchase','expense') and l.credit=p_amount))) then
    raise exception 'The selected cash/bank ledger is not present on the posted voucher for this amount';
  end if;
  if p_allocation_type='sales' then
    select total_amount,sale_type,paid_amount into v_total,v_sale_type,v_paid from public.sales_invoices where id=p_invoice_id and company_id=p_company_id and coalesce(is_deleted,false)=false for update;
    if not found then raise exception 'Sales invoice not found for this company'; end if;
    if upper(coalesce(v_sale_type,''))='CASH' then raise exception 'Cash invoices are already settled; select a credit invoice'; end if;
    select greatest(coalesce(v_paid,0),coalesce(sum(amount),0)) into v_paid from public.sales_invoice_receipts where company_id=p_company_id and invoice_id=p_invoice_id;
    if p_amount>greatest(0,coalesce(v_total,0)-coalesce(v_paid,0))+0.01 then raise exception 'Receipt exceeds the sales invoice outstanding balance'; end if;
    insert into public.sales_invoice_receipts(company_id,invoice_id,voucher_id,receipt_date,amount,payment_method,bank_ledger_id,reference_number)
    values(p_company_id,p_invoice_id,p_voucher_id,coalesce(p_payment_date,current_date),p_amount,coalesce(p_payment_method,'Bank Transfer'),p_bank_ledger_id,p_reference_number);
    update public.sales_invoices set paid_amount=coalesce(v_paid,0)+p_amount,payment_status=case when coalesce(v_paid,0)+p_amount>=v_total then 'Paid' else 'Partially Paid' end,updated_at=now() where id=p_invoice_id and company_id=p_company_id;
  elsif p_allocation_type='purchase' then
    select grand_total,paid_amount into v_total,v_paid from public.purchase_invoices where id=p_invoice_id and company_id=p_company_id and coalesce(is_deleted,false)=false for update;
    if not found then raise exception 'Purchase invoice not found for this company'; end if;
    select greatest(coalesce(v_paid,0),coalesce(sum(amount),0)) into v_paid from public.purchase_invoice_payments where company_id=p_company_id and invoice_id=p_invoice_id;
    if p_amount>greatest(0,coalesce(v_total,0)-coalesce(v_paid,0))+0.01 then raise exception 'Payment exceeds the purchase invoice outstanding balance'; end if;
    insert into public.purchase_invoice_payments(company_id,invoice_id,voucher_id,payment_date,amount,payment_method,bank_ledger_id,reference_number)
    values(p_company_id,p_invoice_id,p_voucher_id,coalesce(p_payment_date,current_date),p_amount,coalesce(p_payment_method,'Bank Transfer'),p_bank_ledger_id,p_reference_number);
    update public.purchase_invoices set paid_amount=coalesce(v_paid,0)+p_amount,payment_status=case when coalesce(v_paid,0)+p_amount>=v_total then 'Paid' else 'Partially Paid' end,updated_at=now() where id=p_invoice_id and company_id=p_company_id;
  elsif p_allocation_type='expense' then
    select total_amount,paid_amount,vendor_id,payee_name into v_total,v_paid,v_vendor_id,v_payee from public.expenses where id=p_expense_id and company_id=p_company_id for update;
    if not found then raise exception 'Expense not found for this company'; end if;
    if p_amount>greatest(0,coalesce(v_total,0)-coalesce(v_paid,0))+0.01 then raise exception 'Payment exceeds the expense outstanding balance'; end if;
    insert into public.expense_payments(company_id,expense_id,vendor_id,payment_no,payment_date,paid_to,payment_method,account_name,reference_no,amount,status,remarks)
    values(p_company_id,p_expense_id,v_vendor_id,'PAY-'||upper(substr(gen_random_uuid()::text,1,8)),coalesce(p_payment_date,current_date),coalesce(v_payee,'Expense Payee'),coalesce(p_payment_method,'Bank Transfer'),p_account_name,p_reference_number,p_amount,'Completed',p_remarks);
    update public.expenses set paid_amount=coalesce(v_paid,0)+p_amount,payment_status=case when coalesce(v_paid,0)+p_amount>=v_total then 'Paid' else 'Partially Paid' end,updated_at=now() where id=p_expense_id and company_id=p_company_id;
  else raise exception 'Unsupported banking allocation type: %',p_allocation_type;
  end if;
  return v;
end; $$;
grant execute on function public.post_banking_voucher(uuid,uuid,text,uuid,uuid,date,numeric,text,uuid,text,text,text) to authenticated;