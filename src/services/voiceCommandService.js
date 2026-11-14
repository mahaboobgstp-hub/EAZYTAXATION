import { supabase } from "../supabase/supabaseClient";
import { createVoiceSession, updateVoiceSession } from "./voiceTransactionSessionService";

async function getVoiceFunctionError(error) {
  const response = error?.context;
  if (response && typeof response.clone === "function") {
    try {
      const payload = await response.clone().json();
      if (payload?.error) return payload.requestId ? payload.error + " (Reference: " + payload.requestId + ")" : payload.error;
      if (payload?.message) return payload.message;
      if (payload?.detail?.message) return payload.detail.message;
      if (typeof payload?.detail === "string") return payload.detail;
    } catch {
      try { const raw = await response.clone().text(); if (raw) return raw.slice(0, 700); } catch {}
    }
  }
  return error?.message || "Voice command could not be processed. Please try again.";
}

export async function transcribeVoiceAudio({ audioBlob, language = "auto" }) {
  if (!audioBlob || !audioBlob.size) throw new Error("Record a voice command first.");
  const form = new FormData();
  const extension = audioBlob.type.includes("mp4") ? "mp4" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
  form.append("file", audioBlob, `voice-command.${extension}`);
  form.append("language", language);
  const { data, error } = await supabase.functions.invoke("transcribe-voice-audio", { body: form });
  if (error) throw new Error(await getVoiceFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.transcript) throw new Error("No speech was recognized. Please try again.");
  return data;
}

export async function processVoiceCommand({ companyId, text, sessionId, previousDraft }) {
  if (!companyId) throw new Error("Select a company before using voice commands.");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error("Please sign in again.");
  if (!text?.trim()) throw new Error("No recognized text was provided.");

  const body = new FormData();
  body.append("companyId", companyId);
  body.append("text", text.trim());
  if (previousDraft) body.append("previousDraft", JSON.stringify(previousDraft));
  const { data, error } = await supabase.functions.invoke("process-voice-command", { body });
  if (error) throw new Error(await getVoiceFunctionError(error));
  if (data?.error) throw new Error(data.error);

  const draftData = { transcript: data.transcript, language: data.detectedLanguage, commands: data.commands, response: data.response };
  const transactionType = data.commands?.[0]?.transaction_type || "general";
  const title = data.commands?.length > 1 ? `${data.commands.length} voice commands` : (data.commands?.[0]?.summary || "Voice command draft");
  const sessionRecord = sessionId
    ? await updateVoiceSession(sessionId, companyId, { title, draftData, status: "ready_for_review", conversationContext: { language: data.detectedLanguage, lastTranscript: data.transcript } })
    : await createVoiceSession({ companyId, transactionType, title, draftData, conversationContext: { language: data.detectedLanguage } });
  return { ...data, session: sessionRecord };
}

export async function confirmVoiceDraft(sessionId, companyId, draftData) {
  return updateVoiceSession(sessionId, companyId, {
    draftData: { ...draftData, userConfirmed: true, confirmedAt: new Date().toISOString() },
    status: "paused",
  });
}
