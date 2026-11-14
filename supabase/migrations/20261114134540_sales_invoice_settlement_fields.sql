alter table public.sales_invoices add column if not exists paid_amount numeric(18,2) not null default 0, add column if not exists payment_status text not null default 'Unpaid';
do $$ begin if not exists(select 1 from pg_constraint where conname='sales_invoices_payment_status_check' and conrelid='public.sales_invoices'::regclass) then alter table public.sales_invoices add constraint sales_invoices_payment_status_check check(payment_status in ('Unpaid','Partially Paid','Paid')); end if; end $$;
update public.sales_invoices set paid_amount=coalesce(total_amount,0),payment_status='Paid' where upper(coalesce(sale_type,''))='CASH' and coalesce(paid_amount,0)=0;
create or replace function public.sync_cash_sales_invoice_payment() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if upper(coalesce(new.sale_type,''))='CASH' and coalesce(new.paid_amount,0)=0 then new.paid_amount:=coalesce(new.total_amount,0);new.payment_status:='Paid';
 elsif coalesce(new.paid_amount,0)>=coalesce(new.total_amount,0) and coalesce(new.total_amount,0)>0 then new.payment_status:='Paid';
 elsif coalesce(new.paid_amount,0)>0 then new.payment_status:='Partially Paid';else new.payment_status:='Unpaid';end if;return new;end;$$;
drop trigger if exists sync_cash_sales_invoice_payment on public.sales_invoices;
create trigger sync_cash_sales_invoice_payment before insert or update of total_amount,sale_type,paid_amount on public.sales_invoices for each row execute function public.sync_cash_sales_invoice_payment();