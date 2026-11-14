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
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !anonKey) return json({ error: "Supabase authentication is not configured." }, 503);
    if (!openAiKey) return json({ error: "OpenAI transcription is not configured. Add OPENAI_API_KEY to Supabase Edge Function secrets." }, 503);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

    const incoming = await req.formData();
    const file = incoming.get("file");
    const selectedLanguage = String(incoming.get("language") || "auto").toLowerCase();
    if (!(file instanceof File)) return json({ error: "Audio recording is missing." }, 400);
    if (file.size === 0) return json({ error: "Audio recording is empty." }, 400);
    if (file.size > 25 * 1024 * 1024) return json({ error: "Audio recording exceeds the 25 MB limit." }, 413);
    if (!["auto", "en-in", "en", "hi", "te"].includes(selectedLanguage)) {
      return json({ error: "Unsupported language selection." }, 400);
    }

    const audio = new FormData();
    audio.append("file", file, file.name || "voice-command.webm");
    audio.append("model", Deno.env.get("OPENAI_TRANSCRIPTION_MODEL") || "gpt-transcribe");
    if (selectedLanguage === "en" || selectedLanguage === "en-in") audio.append("language", "en");
    if (selectedLanguage === "hi" || selectedLanguage === "te") audio.append("language", selectedLanguage);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openAiKey}` },
        body: audio,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      console.error("OpenAI transcription failed", { status: response.status, userId: user.id });
      if (response.status === 429) return json({ error: "OpenAI rate limit or usage quota reached. Check API billing and try again." }, 429);
      if (response.status === 401 || response.status === 403) return json({ error: "OpenAI API authentication failed. Check the OPENAI_API_KEY secret." }, 502);
      return json({ error: failure?.error?.message || "OpenAI could not transcribe this recording. Please try again." }, 502);
    }

    const payload = await response.json();
    const transcript = String(payload?.text || "").trim();
    if (!transcript) return json({ error: "No speech was recognized. Please record again." }, 422);
    return json({
      transcript,
      provider: "openai",
      fallback_used: false,
      language: selectedLanguage,
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Speech transcription timed out. Please try a shorter recording."
      : "Speech transcription is temporarily unavailable. Please try again.";
    console.error("transcribe-voice-audio failed", error);
    return json({ error: message }, 500);
  }
});
