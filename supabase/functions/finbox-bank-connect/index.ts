import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-syd-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "SERVER_CONFIGURATION_ERROR", message: "Supabase function secrets are incomplete." }, 500);
  }

  try {
    const body = await req.json();
    const action = String(body?.action || "");
    const companyId = String(body?.company_id || "");

    // Scheduled calls use a separate secret and never accept browser-supplied company IDs.
    if (action === "sync_due") {
      const cronSecret = Deno.env.get("SYD_BANK_SYNC_CRON_SECRET");
      if (!cronSecret || req.headers.get("x-syd-cron-secret") !== cronSecret) {
        return json({ error: "UNAUTHORIZED" }, 401);
      }
      return json({
        ok: true,
        status: "scheduler_scaffold_ready",
        message: "Daily sync scheduler is gated. FinBox transaction retrieval will be enabled after its API contract is configured."
      }, 501);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "UNAUTHORIZED" }, 401);

    if (!companyId) return json({ error: "COMPANY_REQUIRED", message: "company_id is required." }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Match SYD's current CompanyContext ownership model; never trust a client company_id alone.
    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("id, owner_user_id")
      .eq("id", companyId)
      .eq("owner_user_id", userData.user.id)
      .maybeSingle();
    if (companyError) throw companyError;
    if (!company) return json({ error: "COMPANY_ACCESS_DENIED" }, 403);

    if (action === "provider_health") {
      const required = [
        "FINBOX_API_KEY",
        "FINBOX_API_BASE_URL",
        "FINBOX_CREATE_SESSION_PATH",
        "FINBOX_FETCH_TRANSACTIONS_PATH"
      ];
      const configured = required.filter((key) => Boolean(Deno.env.get(key)));
      return json({
        provider: "finbox",
        mode: Deno.env.get("FINBOX_MODE") || "sandbox",
        credentials_present: configured.includes("FINBOX_API_KEY"),
        configuration_items_present: configured.length,
        configuration_items_required: required.length,
        adapter_status: "awaiting_finbox_api_contract",
        missing_configuration: required.filter((key) => !Deno.env.get(key)),
        message: "The secure SYD endpoint is installed. Provider-specific request/response mapping must be completed against FinBox's current documentation before live calls."
      });
    }

    if (action === "get_status") {
      const { data, error } = await admin
        .from("bank_feed_connections")
        .select("id, bank_account_id, provider, connection_status, refresh_frequency, consent_expires_at, last_sync_at, next_sync_at, last_sync_status, last_error_code, last_error_message, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ provider: "finbox", connections: data || [] });
    }

    if (action === "start_connection" || action === "sync_account") {
      const bankAccountId = String(body?.bank_account_id || "");
      if (!bankAccountId) return json({ error: "BANK_ACCOUNT_REQUIRED" }, 400);
      const { data: bankAccount, error: bankError } = await admin
        .from("bank_account_profiles")
        .select("id, bank_name, account_type")
        .eq("id", bankAccountId)
        .eq("company_id", companyId)
        .maybeSingle();
      if (bankError) throw bankError;
      if (!bankAccount) return json({ error: "BANK_ACCOUNT_ACCESS_DENIED" }, 403);

      // Do not guess FinBox endpoint paths, payload fields, signature rules, or consent SDK.
      // Wire these calls only after FinBox provides the tenant-specific API documentation.
      return json({
        error: "FINBOX_ADAPTER_NOT_CONFIGURED",
        message: "The SYD bank-feed foundation is ready, but FinBox's current API contract and sandbox details are required to start consent or retrieve transactions.",
        bank_account_id: bankAccount.id,
        bank_name: bankAccount.bank_name,
        account_type: bankAccount.account_type
      }, 501);
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error("finbox-bank-connect:", safeError(error));
    return json({ error: "INTERNAL_ERROR", message: safeError(error) }, 500);
  }
});
