import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Invalid session" }, 401);
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "OPENAI_API_KEY is not configured in Supabase Edge Function secrets." }, 503);

    const form = await req.formData();
    const audio = form.get("audio");
    const typedText = String(form.get("text") || "").trim();
    const companyId = String(form.get("companyId") || "").trim();
    if (!companyId) return json({ error: "Select a company first." }, 400);
    if (!audio && !typedText) return json({ error: "Speak or type a command." }, 400);

    let transcript = typedText;
    let detectedLanguage = "unknown";
    if (audio instanceof File) {
      const audioForm = new FormData();
      audioForm.append("file", audio, audio.name || "voice-command.webm");
      audioForm.append("model", "gpt-4o-mini-transcribe");
      audioForm.append("response_format", "json");
      const transcription = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: audioForm,
      });
      const transcriptionBody = await transcription.json();
      if (!transcription.ok) return json({ error: transcriptionBody.error?.message || "Speech recognition failed." }, 502);
      transcript = String(transcriptionBody.text || "").trim();
      detectedLanguage = "auto-detected";
    }
    if (!transcript) return json({ error: "No speech was recognized. Please try again." }, 422);

    const prompt = `You are the command-understanding engine for EAZYTAXATION, an Indian accounting ERP.
Understand commands in English, Hindi, Telugu, and mixed-language speech. Normalize accounting terminology and Indian number/currency expressions.
Return ONLY valid JSON with keys: language, response, commands.
commands must be an array, one item per requested action, preserving the spoken order. Each item:
{ "intent": string, "transaction_type": one of "sales_invoice","purchase_invoice","expense","customer_master","vendor_master","item_master","navigation","general", "fields": object, "missing_fields": string[], "summary": string, "requires_clarification": boolean }.
Interpret corrections as REPLACEMENTS of earlier field values, not additions. For multiple commands, return multiple items. Do not invent missing values, tax rates, parties, dates, quantities, prices, or account codes. If ambiguous, ask a clarification in response and mark requires_clarification true.
Never claim that anything has been saved, posted, submitted, or paid. This engine only prepares drafts. Do not execute actions, make database changes, or create accounting entries.
For accounting entries, identify missing essential details rather than guessing. language should be "English", "Hindi", "Telugu", or "Mixed".`;

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: prompt }, { role: "user", content: transcript }],
      }),
    });
    const result = await completion.json();
    if (!completion.ok) return json({ error: result.error?.message || "AI command understanding failed." }, 502);
    const parsed = JSON.parse(result.choices?.[0]?.message?.content || "{}");
    if (!Array.isArray(parsed.commands)) return json({ error: "AI returned an invalid command structure." }, 502);
    return json({ transcript, detectedLanguage: parsed.language || detectedLanguage, response: parsed.response || "I prepared your command for review.", commands: parsed.commands });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Voice command processing failed." }, 500);
  }
});
