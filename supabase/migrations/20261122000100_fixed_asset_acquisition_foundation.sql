-- Fixed asset acquisition groundwork and optional manufacturer serial tracking.
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS serial_number text;

CREATE TABLE IF NOT EXISTS public.fixed_asset_acquisitions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 accounting_mode text NOT NULL CHECK (accounting_mode IN ('chart_of_accounts','without_chart_of_accounts')),
 supplier_name text, supplier_gstin text, supplier_id uuid, invoice_number text,
 invoice_date date NOT NULL, invoice_attachment_url text,
 subtotal numeric(18,2) NOT NULL DEFAULT 0, gst_total numeric(18,2) NOT NULL DEFAULT 0,
 invoice_total numeric(18,2) NOT NULL DEFAULT 0, amount_paid numeric(18,2) NOT NULL DEFAULT 0,
 balance_due numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Draft',
 voucher_id uuid, notes text, created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fixed_asset_acquisition_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 acquisition_id uuid NOT NULL REFERENCES public.fixed_asset_acquisitions(id) ON DELETE CASCADE,
 category_id uuid, category_name text, item_description text NOT NULL,
 quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
 unit_rate numeric(18,2) NOT NULL DEFAULT 0, line_subtotal numeric(18,2) NOT NULL DEFAULT 0,
 igst numeric(18,2) NOT NULL DEFAULT 0, cgst numeric(18,2) NOT NULL DEFAULT 0,
 sgst numeric(18,2) NOT NULL DEFAULT 0, cess numeric(18,2) NOT NULL DEFAULT 0,
 capitalized_cost numeric(18,2) NOT NULL DEFAULT 0, asset_ids uuid[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fixed_asset_acquisition_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 acquisition_id uuid NOT NULL REFERENCES public.fixed_asset_acquisitions(id) ON DELETE CASCADE,
 payment_date date NOT NULL, amount numeric(18,2) NOT NULL CHECK (amount > 0),
 payment_method text NOT NULL CHECK (payment_method IN ('Cash','Bank','UPI','Other')),
 reference_number text, notes text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fixed_asset_acquisitions_company_date_idx ON public.fixed_asset_acquisitions(company_id, invoice_date);
CREATE INDEX IF NOT EXISTS fixed_asset_acquisition_lines_company_idx ON public.fixed_asset_acquisition_lines(company_id, acquisition_id);
CREATE INDEX IF NOT EXISTS fixed_asset_acquisition_payments_company_idx ON public.fixed_asset_acquisition_payments(company_id, acquisition_id, payment_date);

ALTER TABLE public.fixed_asset_acquisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_asset_acquisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_asset_acquisition_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
 CREATE POLICY fixed_asset_acquisitions_company_access ON public.fixed_asset_acquisitions FOR ALL
 USING (private.is_company_owner(company_id) OR private.has_company_user_permission(company_id,'accounting',false) OR private.has_ca_company_access(company_id,false))
 WITH CHECK (private.is_company_owner(company_id) OR private.has_company_user_permission(company_id,'accounting',true) OR private.has_ca_company_access(company_id,true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 CREATE POLICY fixed_asset_acquisition_lines_company_access ON public.fixed_asset_acquisition_lines FOR ALL
 USING (private.is_company_owner(company_id) OR private.has_company_user_permission(company_id,'accounting',false) OR private.has_ca_company_access(company_id,false))
 WITH CHECK (private.is_company_owner(company_id) OR private.has_company_user_permission(company_id,'accounting',true) OR private.has_ca_company_access(company_id,true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 CREATE POLICY fixed_asset_acquisition_payments_company_access ON public.fixed_asset_acquisition_payments FOR ALL
 USING (private.is_company_owner(company_id) OR private.has_company_user_permission(company_id,'accounting',false) OR private.has_ca_company_access(company_id,false))
 WITH CHECK (private.is_company_owner(company_id) OR private.has_company_user_permission(company_id,'accounting',true) OR private.has_ca_company_access(company_id,true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
