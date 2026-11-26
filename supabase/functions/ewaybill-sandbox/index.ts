import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401);

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) return json({ error: "UNAUTHORIZED" }, 401);

    const body = await req.json();
    const action = String(body?.action || "");
    const companyId = String(body?.company_id || "");
    if (!companyId) return json({ error: "COMPANY_REQUIRED" }, 400);

    // The caller's JWT/RLS context determines company visibility and permissions.
    const { data: company, error: companyError } = await userClient
      .from("companies").select("id").eq("id", companyId).maybeSingle();
    if (companyError) throw companyError;
    if (!company) return json({ error: "COMPANY_ACCESS_DENIED" }, 403);

    if (action === "sandbox_health") {
      const baseUrl = Deno.env.get("PERIONE_SANDBOX_BASE_URL") || "";
      const credentialsPresent = Boolean(Deno.env.get("PERIONE_SANDBOX_CREDENTIALS"));
      return json({
        provider: "perione",
        environment: "sandbox",
        sandbox_base_url_configured: Boolean(baseUrl),
        sandbox_credentials_configured: credentialsPresent,
        adapter_status: "awaiting_api_contract_and_credentials",
        supported_operations: ["generate", "cancel"],
        enabled_operations: [],
        production_enabled: false,
        message: "Readiness only. Live production operations are disabled; generation/cancellation await PeriOne's verified sandbox contract and credentials.",
      });
    }

    if (action === "get_status") {
      const invoiceId = String(body?.invoice_id || "");
      let query = userClient.from("sales_eway_bills")
        .select("id,company_id,invoice_id,provider,environment,eway_bill_number,status,generated_at,valid_until,cancelled_at,cancellation_reason_code,cancellation_remarks,provider_status,provider_error_code,provider_error_message,last_operation,last_operation_at,created_at,updated_at")
        .eq("company_id", companyId);
      if (invoiceId) query = query.eq("invoice_id", invoiceId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return json({ environment: "sandbox", records: data || [] });
    }

    if (action === "generate" || action === "cancel") {
      // Fail closed until the exact PeriOne contract is verified. No request is sent.
      return json({
        error: "PERIONE_SANDBOX_ADAPTER_NOT_READY",
        operation: action,
        environment: "sandbox",
        production_enabled: false,
        message: "Not enabled: verified PeriOne sandbox endpoint, authentication, payload and response contract are still required. No API request was sent.",
      }, 501);
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    // Keep provider tokens, raw request payloads, and invoice data out of server logs.
    console.error("ewaybill-sandbox request failed");
    return json({ error: "INTERNAL_ERROR", message: "The E-Way Bill sandbox request could not be processed." }, 500);
  }
});
