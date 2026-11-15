import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const planSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: ["navigate","prepare_form","answer_question","clarify","unsupported"] },
    screen_id: { type: ["string","null"] },
    fields: { type: "array", items: {
      type: "object", additionalProperties: false,
      properties: { field_id: { type: "string" }, value: { type: ["string","null"] } },
      required: ["field_id","value"],
    } },
    missing_information: { type: "array", items: { type: "string" } },
    requires_confirmation: { type: "boolean" },
    response: { type: "string" },
  },
  required: ["intent","screen_id","fields","missing_information","requires_confirmation","response"],
};

function safeObject(value: unknown, maxLength = 8000) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (JSON.stringify(value).length > maxLength) throw new Error("Context is too large.");
  return value;
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";
    if (!supabaseUrl || !anonKey) return json({ error: "Supabase authentication is not configured." }, 503);
    if (!openAiKey) return json({ error: "OPENAI_API_KEY is not configured in Supabase Edge Function secrets." }, 503);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

    const body = await req.json();
    const command = String(body?.command || "").trim();
    if (!command) return json({ error: "A command is required." }, 400);
    if (command.length > 3000) return json({ error: "Command exceeds the 3,000 character limit." }, 413);
    const platform = ["web","android","ios"].includes(body?.platform) ? body.platform : "web";
    const companyContext = safeObject(body?.companyContext, 3000);
    const currentScreen = safeObject(body?.currentScreen, 3000);
    const registeredScreens = Array.isArray(body?.registeredScreens) ? body.registeredScreens.slice(0, 150) : [];
    const fields = Array.isArray(body?.fields) ? body.fields.slice(0, 100) : [];
    const conversationContext = safeObject(body?.conversationContext, 2000);

    const instructions = [
      "You are SYD Intelligence, the command-understanding layer for SYD Billing & Accounting.",
      "Understand natural-language business instructions, Indian accounting terminology and mixed-language phrasing.",
      "Use only supplied registeredScreens, currentScreen and field definitions. Never invent a screen ID, field ID, route, option, company setting, tax rate, account code or application capability.",
      "Only select a screen_id that exactly matches an item in registeredScreens. If no suitable registered screen exists, use null and ask for clarification or mark unsupported.",
      "Company context is informational only; it is not proof of permissions or authorization.",
      "If operatingMode is billing_only, do not propose accounting-only workflows.",
      "If a field is not in the supplied field definitions, do not return it in fields; put the missing requirement in missing_information.",
      "Do not invent customer, supplier, item, quantity, rate, date, tax treatment or amounts. Ask when details are missing or ambiguous.",
      "Treat later corrections as replacements of earlier field values.",
      "Return a proposed plan only. Never claim a screen was opened, a form was filled, data was saved or a transaction was posted.",
      "This endpoint cannot execute tools, navigate UI, modify forms, query business records or write to the database.",
      "Use clarify when essential information is missing. Use unsupported when a requested capability is not represented by supplied definitions.",
      "Set requires_confirmation to true for any prepare_form intent.",
    ].join(" ");

    const input = JSON.stringify({ command, platform, companyContext, registeredScreens, currentScreen, fields, conversationContext });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let providerResponse: Response;
    try {
      providerResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model, instructions, input, store: false, max_output_tokens: 1200,
          text: { format: { type: "json_schema", name: "syd_command_plan", strict: true, schema: planSchema } },
        }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }

    if (!providerResponse.ok) {
      const detail = await providerResponse.text();
      console.error("SYD AI provider request failed", { requestId, userId: user.id, status: providerResponse.status, detail: detail.slice(0, 500) });
      if (providerResponse.status === 429) return json({ error: "AI usage limit reached. Please try again later.", requestId }, 429);
      return json({ error: "SYD Intelligence could not process this request.", requestId }, 502);
    }

    const providerData = await providerResponse.json();
    if (providerData.status !== "completed") return json({ error: "AI response was incomplete. Please try again.", requestId }, 502);
    const outputItems = Array.isArray(providerData.output) ? providerData.output : [];
    const message = outputItems.find((item: any) => item.type === "message");
    if (message?.content?.some((item: any) => item.type === "refusal")) return json({ error: "The request could not be completed.", requestId }, 422);
    const outputText = message?.content?.find((item: any) => item.type === "output_text")?.text;
    if (!outputText) return json({ error: "AI returned no structured action plan.", requestId }, 502);

    let plan: any;
    try { plan = JSON.parse(outputText); }
    catch { return json({ error: "AI returned an unreadable action plan.", requestId }, 502); }

    const allowedIntents = ["navigate","prepare_form","answer_question","clarify","unsupported"];
    if (!allowedIntents.includes(plan.intent)) return json({ error: "AI returned an unsupported intent.", requestId }, 502);
    const knownScreenIds = new Set(registeredScreens.map((screen: any) => String(screen?.screenId || "")));
    if (plan.screen_id && !knownScreenIds.has(String(plan.screen_id))) {
      plan.screen_id = null;
      if (plan.intent === "navigate" || plan.intent === "prepare_form") plan.intent = "clarify";
      plan.missing_information = [...(Array.isArray(plan.missing_information) ? plan.missing_information : []), "The requested destination is not yet registered in SYD's verified screen catalogue."];
    }
    const knownFieldIds = new Set(fields.map((field: any) => String(field?.fieldId || "")));
    plan.fields = Array.isArray(plan.fields) ? plan.fields.filter((field: any) => knownFieldIds.has(String(field?.field_id || ""))) : [];
    if (plan.intent === "prepare_form") plan.requires_confirmation = true;

    return json({
      plan, requestId, model,
      usage: {
        inputTokens: providerData.usage?.input_tokens ?? null,
        outputTokens: providerData.usage?.output_tokens ?? null,
        totalTokens: providerData.usage?.total_tokens ?? null,
      },
      execution: { executed: false, phase: 1 },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    const message = timedOut ? "SYD Intelligence timed out. Please try again." :
      error instanceof Error ? error.message : "Unexpected intelligence service error.";
    console.error("SYD AI request failed", { requestId, message });
    return json({ error: message, requestId }, 500);
  }
});