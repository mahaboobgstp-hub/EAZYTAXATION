alter table public.purchase_invoices
  add column if not exists transporter_name text,
  add column if not exists transporter_id text,
  add column if not exists transport_doc_no text,
  add column if not exists transport_doc_date date;

comment on column public.purchase_invoices.transporter_name is 'Transporter name recorded against the supplier purchase invoice';
comment on column public.purchase_invoices.transporter_id is 'Transporter GSTIN or TRANSIN recorded against the supplier purchase invoice';
comment on column public.purchase_invoices.transport_doc_no is 'Transport document or LR number recorded against the supplier purchase invoice';
comment on column public.purchase_invoices.transport_doc_date is 'Transport document date recorded against the supplier purchase invoice';
