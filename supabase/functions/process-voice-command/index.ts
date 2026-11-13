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

const readProviderError = async (response: Response) => {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw);
    return String(parsed?.error?.message || parsed?.message || raw).slice(0, 700);
  } catch {
    return raw.slice(0, 700);
  }
};

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
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
    if (!apiKey) {
      console.error("Voice command missing OPENAI_API_KEY", { requestId });
      return json({ error: "OPENAI_API_KEY is missing from Supabase Edge Function secrets.", requestId }, 503);
    }

    const form = await req.formData();
    const audio = form.get("audio");
    const typedText = String(form.get("text") || "").trim();
    const companyId = String(form.get("companyId") || "").trim();
    const previousDraftRaw = String(form.get("previousDraft") || "").trim();
    let previousDraft: unknown = null;
    if (previousDraftRaw) { try { previousDraft = JSON.parse(previousDraftRaw); } catch { return json({ error: "Previous draft context is invalid." }, 400); } }
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
      if (!transcription.ok) {
        const detail = await readProviderError(transcription);
        console.error("OpenAI transcription failed", { requestId, status: transcription.status, detail });
        return json({ error: "OpenAI transcription error (" + transcription.status + "): " + detail, stage: "transcription", requestId }, 502);
      }
      const transcriptionBody = await transcription.json();
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
        messages: [
          { role: "system", content: prompt },
          ...(previousDraft ? [{ role: "assistant", content: `Existing draft context (use corrections to replace prior field values): ${JSON.stringify(previousDraft)}` }] : []),
          { role: "user", content: transcript },
        ],
      }),
    });
    if (!completion.ok) {
      const detail = await readProviderError(completion);
      console.error("OpenAI interpretation failed", { requestId, status: completion.status, detail });
      return json({ error: "OpenAI command interpretation error (" + completion.status + "): " + detail, stage: "interpretation", requestId }, 502);
    }
    const result = await completion.json();
    let parsed;
    try {
      parsed = JSON.parse(result.choices?.[0]?.message?.content || "{}");
    } catch (parseError) {
      console.error("OpenAI returned invalid JSON", { requestId, message: String(parseError) });
      return json({ error: "AI returned an unreadable response. Please try again.", stage: "interpretation", requestId }, 502);
    }
    if (!Array.isArray(parsed.commands)) return json({ error: "AI returned an invalid command structure.", requestId }, 502);
    return json({ transcript, detectedLanguage: parsed.language || detectedLanguage, response: parsed.response || "I prepared your command for review.", commands: parsed.commands, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice command processing failed.";
    console.error("Voice command handler failed", { requestId, message });
    return json({ error: "Voice processing failed: " + message, requestId }, 500);
  }
});
