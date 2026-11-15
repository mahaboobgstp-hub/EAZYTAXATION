create index if not exists bank_feed_sync_logs_company_connection_idx
  on public.bank_feed_sync_logs(company_id, connection_id);
create index if not exists bank_statement_lines_company_feed_connection_idx
  on public.bank_statement_lines(company_id, bank_feed_connection_id)
  where bank_feed_connection_id is not null;