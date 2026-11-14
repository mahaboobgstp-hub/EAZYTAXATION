alter table public.invoice_settings
  add column if not exists invoice_auto_numbering boolean not null default true,
  add column if not exists invoice_number_prefix text not null default 'ET',
  add column if not exists invoice_number_year_format text not null default 'FY',
  add column if not exists invoice_number_separator text not null default '-',
  add column if not exists invoice_number_padding integer not null default 5,
  add column if not exists invoice_next_number integer not null default 1,
  add column if not exists invoice_reset_each_year boolean not null default true,
  add column if not exists invoice_number_counters jsonb not null default '{}'::jsonb;

create unique index if not exists invoice_settings_company_id_unique
  on public.invoice_settings (company_id)
  where company_id is not null;

create or replace function public.sales_invoice_number(
  p_company_id uuid,
  p_invoice_date date default current_date,
  p_reserve boolean default false
) returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_settings public.invoice_settings%rowtype;
  v_period text;
  v_year text;
  v_next integer;
  v_last integer;
  v_prefix text;
  v_separator text;
  v_padding integer;
  v_counters jsonb;
begin
  if p_company_id is null then
    raise exception 'Company is required to generate an invoice number';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_company_id::text, 0));

  select * into v_settings
  from public.invoice_settings
  where company_id = p_company_id
  for update;

  if not found then
    insert into public.invoice_settings (company_id)
    values (p_company_id);
    select * into v_settings
    from public.invoice_settings
    where company_id = p_company_id
    for update;
  end if;

  if not v_settings.invoice_auto_numbering then
    return null;
  end if;

  if v_settings.invoice_reset_each_year then
    if extract(month from p_invoice_date) >= 4 then
      v_year := to_char(p_invoice_date, 'YY') || '-' ||
        to_char((p_invoice_date + interval '1 year')::date, 'YY');
    else
      v_year := to_char((p_invoice_date - interval '1 year')::date, 'YY') || '-' ||
        to_char(p_invoice_date, 'YY');
    end if;
    v_period := v_year;
  else
    v_year := to_char(p_invoice_date, 'YYYY');
    v_period := 'ALL';
  end if;

  if v_settings.invoice_number_year_format = 'YYYY' then
    v_year := to_char(p_invoice_date, 'YYYY');
  end if;

  v_counters := coalesce(v_settings.invoice_number_counters, '{}'::jsonb);
  v_last := coalesce((v_counters ->> v_period)::integer, v_settings.invoice_next_number - 1);
  v_next := greatest(v_last + 1, v_settings.invoice_next_number);
  v_prefix := trim(coalesce(v_settings.invoice_number_prefix, 'ET'));
  v_separator := coalesce(v_settings.invoice_number_separator, '-');
  v_padding := greatest(1, least(coalesce(v_settings.invoice_number_padding, 5), 12));

  if p_reserve then
    v_counters := jsonb_set(v_counters, array[v_period], to_jsonb(v_next), true);
    update public.invoice_settings
    set invoice_number_counters = v_counters,
        updated_at = now()
    where id = v_settings.id;
  end if;

  return concat_ws(v_separator,
    nullif(v_prefix, ''),
    case when v_settings.invoice_number_year_format = 'NONE' then null else v_year end,
    lpad(v_next::text, v_padding, '0')
  );
end;
$$;

revoke all on function public.sales_invoice_number(uuid, date, boolean) from public;
grant execute on function public.sales_invoice_number(uuid, date, boolean) to authenticated;
