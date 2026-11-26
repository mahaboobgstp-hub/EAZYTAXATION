import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const safeError = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected server error";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);
  }

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

    // Company access is checked using the caller's JWT/RLS context, not service-role access.
    const { data: company, error: companyError } = await userClient
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle();

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
        message: "Sandbox readiness check only. Generation and cancellation remain disabled until PeriOne's exact authentication, payload, and response contracts are verified.",
      });
    }

    if (action === "generate" || action === "cancel") {
      // Deliberately fail closed. Do not guess provider paths, auth headers, payload fields,
      // cancellation reason codes, or response mappings before obtaining the official contract.
      return json({
        error: "PERIONE_SANDBOX_ADAPTER_NOT_READY",
        operation: action,
        environment: "sandbox",
        message: "This operation is not enabled yet. PeriOne sandbox credentials and verified API contract are required before sending requests.",
      }, 501);
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error("ewaybill-sandbox:", safeError(error));
    return json({ error: "INTERNAL_ERROR", message: "The E-Way Bill sandbox request could not be processed." }, 500);
  }
});
