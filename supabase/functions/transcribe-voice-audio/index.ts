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
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) return json({ error: "Supabase authentication is not configured." }, 503);
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

    const asrUrl = Deno.env.get("ASR_SERVICE_URL");
    const asrKey = Deno.env.get("ASR_API_KEY");
    if (!asrUrl || !asrKey) return json({ error: "Speech transcription service is not configured yet." }, 503);

    const incoming = await req.formData();
    const file = incoming.get("file");
    const language = String(incoming.get("language") || "auto").toLowerCase();
    if (!(file instanceof File)) return json({ error: "Audio recording is missing." }, 400);
    if (file.size === 0) return json({ error: "Audio recording is empty." }, 400);
    if (file.size > 25 * 1024 * 1024) return json({ error: "Audio recording exceeds the 25 MB limit." }, 413);
    if (!["auto", "en-in", "en", "hi", "te"].includes(language)) return json({ error: "Unsupported language selection." }, 400);

    const outbound = new FormData();
    outbound.append("file", file, file.name || "voice-command.webm");
    outbound.append("language", language);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150_000);
    let response: Response;
    try {
      response = await fetch(asrUrl.replace(/\/$/, "") + "/v1/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${asrKey}` },
        body: outbound,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("ASR service returned an error", { status: response.status, userId: user.id });
      const detail = payload?.detail;
      return json({ error: typeof detail === "string" ? detail : (detail?.message || "Speech transcription failed. Please try again.") }, response.status >= 500 ? 502 : response.status);
    }
    if (!payload?.transcript) return json({ error: "No speech was recognized. Please try again." }, 502);
    return json({
      transcript: payload.transcript,
      provider: payload.provider,
      fallback_used: Boolean(payload.fallback_used),
      language: payload.language,
      duration_seconds: payload.duration_seconds,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Speech transcription timed out. Please try a shorter recording."
      : "Speech transcription service is temporarily unavailable.";
    console.error("transcribe-voice-audio failed", error);
    return json({ error: message }, 500);
  }
});
