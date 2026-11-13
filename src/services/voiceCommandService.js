import { supabase } from "../supabase/supabaseClient";
import { createVoiceSession, updateVoiceSession } from "./voiceTransactionSessionService";

export async function processVoiceCommand({ companyId, audioBlob, text, sessionId }) {
  if (!companyId) throw new Error("Select a company before using voice commands.");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error("Please sign in again.");

  const body = new FormData();
  body.append("companyId", companyId);
  if (audioBlob) body.append("audio", audioBlob, "voice-command.webm");
  if (text) body.append("text", text);
  const { data, error } = await supabase.functions.invoke("process-voice-command", { body });
  if (error) throw new Error(data?.error || error.message || "Voice command could not be processed.");
  if (data?.error) throw new Error(data.error);

  const draftData = { transcript: data.transcript, language: data.detectedLanguage, commands: data.commands, response: data.response };
  const transactionType = data.commands?.[0]?.transaction_type || "general";
  const title = data.commands?.length > 1 ? `${data.commands.length} voice commands` : (data.commands?.[0]?.summary || "Voice command draft");
  const sessionRecord = sessionId
    ? await updateVoiceSession(sessionId, companyId, { title, draftData, status: "ready_for_review", conversationContext: { language: data.detectedLanguage } })
    : await createVoiceSession({ companyId, transactionType, title, draftData, conversationContext: { language: data.detectedLanguage } });
  return { ...data, session: sessionRecord };
}

export async function confirmVoiceDraft(sessionId, companyId, draftData) {
  return updateVoiceSession(sessionId, companyId, {
    draftData: { ...draftData, userConfirmed: true, confirmedAt: new Date().toISOString() },
    status: "paused",
  });
}
